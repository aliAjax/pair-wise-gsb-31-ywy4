import { CompensationPayer, CompensationStatus } from '@/constants/compensation';
import { ExchangeStatus } from '@/constants/exchange';
import type { Compensation } from '@/models/compensation';
import type { Exchange } from '@/models/exchange';

export type CompensationRole = 'payer' | 'payee';

export interface CompensationView {
  /** 当前用户相对这笔补款的角色 */
  role: CompensationRole;
  status: CompensationStatus;
  amount: number;
  paidAmount: number;
  refundedAmount: number;
  /** 待付：待补款阶段还未到账的金额（付款方视角） */
  pendingAmount: number;
  /** 已付/已收：已经到账的金额 */
  paidTotal: number;
  /** 待退回：取消或拒绝后保留的已到账金额 */
  refundingAmount: number;
  /** 已退回 */
  refundTotal: number;
}

/** 判断当前用户是付款方还是收款方 */
export const resolveCompensationRole = (compensation: Compensation | null, userId: string | undefined): CompensationRole => {
  if (!compensation || !userId) return 'payer';
  return compensation.payer_user_id === userId ? 'payer' : 'payee';
};

/** 根据约定付款方计算付款/收款用户 id */
export const resolveCompensationUsers = (
  payer: CompensationPayer,
  fromUserId: string,
  toUserId: string,
): { payerUserId: string; payeeUserId: string } => {
  if (payer === CompensationPayer.INITIATOR) {
    return { payerUserId: fromUserId, payeeUserId: toUserId };
  }
  return { payerUserId: toUserId, payeeUserId: fromUserId };
};

const isPendingStage = (status: ExchangeStatus) =>
  status === ExchangeStatus.PENDING || status === ExchangeStatus.AWAITING_PAYMENT;

/**
 * 汇总一笔交换的补款金额视图。
 * - 旧请求 / 无补款约定：返回 null，按无需补款处理。
 * - 待确认阶段补款实体尚未生成，按约定金额展示“待付”。
 */
export const getCompensationView = (
  exchange: Exchange,
  compensation: Compensation | null,
  userId: string | undefined,
): CompensationView | null => {
  const proposal = exchange.compensation;
  if (!proposal?.amount) return null;

  const role = compensation
    ? resolveCompensationRole(compensation, userId)
    : resolveCompensationUsers(proposal.payer, exchange.from_user_id, exchange.to_user_id).payerUserId === userId
      ? 'payer'
      : 'payee';

  const amount = proposal.amount;

  // 物主还没同意：补款实体未生成，按约定金额提示待付
  if (!compensation) {
    return {
      role,
      status: CompensationStatus.PENDING,
      amount,
      paidAmount: 0,
      refundedAmount: 0,
      pendingAmount: isPendingStage(exchange.status) ? amount : 0,
      paidTotal: 0,
      refundingAmount: 0,
      refundTotal: 0,
    };
  }

  const paid = compensation.paid_amount;
  const refunded = compensation.refunded_amount;
  const refunding =
    compensation.status === CompensationStatus.REFUNDING
      ? Math.max(paid - refunded, 0)
      : 0;

  return {
    role,
    status: compensation.status,
    amount,
    paidAmount: paid,
    refundedAmount: refunded,
    pendingAmount:
      compensation.status === CompensationStatus.PENDING ? Math.max(amount - paid, 0) : 0,
    paidTotal: paid,
    refundingAmount: refunding,
    refundTotal: refunded,
  };
};

/**
 * 个人页补款汇总（当前用户作为付款方的金额视角：待付、已付、退回）。
 */
export const summarizeCompensations = (
  entries: Array<{ exchange: Exchange; compensation: Compensation | null; userId: string }>,
  userId: string,
) => {
  let toPay = 0;
  let paid = 0;
  let refunding = 0;
  let refunded = 0;

  entries.forEach(({ exchange, compensation, userId: entryUserId }) => {
    if (entryUserId !== userId) return;
    const view = getCompensationView(exchange, compensation, userId);
    if (!view || view.role !== 'payer') return;
    toPay += view.pendingAmount;
    paid += view.paidTotal;
    refunding += view.refundingAmount;
    refunded += view.refundTotal;
  });

  return { toPay, paid, refunding, refunded };
};
