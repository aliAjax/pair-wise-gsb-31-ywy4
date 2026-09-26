import { ExchangeStatus } from '@/constants/exchange';
import type { Exchange } from '@/models/exchange';

/** 是否需要补款；旧请求没有补款字段时统一按无需补款处理 */
export const hasCompensation = (exchange: Exchange) =>
  exchange.compensation_amount > 0 && Boolean(exchange.compensation_payer_id);

/** 当前查看用户是否为补款付款方 */
export const isCompensationPayer = (exchange: Exchange, userId: string | null | undefined) =>
  Boolean(exchange.compensation_payer_id && userId && exchange.compensation_payer_id === userId);

/** 应补金额（约定补多少） */
export const compensationAmount = (exchange: Exchange) =>
  hasCompensation(exchange) ? exchange.compensation_amount : 0;

/** 待付金额：约定金额减去已到账金额 */
export const compensationPendingAmount = (exchange: Exchange) => {
  if (!hasCompensation(exchange)) return 0;
  return Math.max(exchange.compensation_amount - exchange.compensation_paid_amount, 0);
};

/** 已到账金额（已付） */
export const compensationPaidAmount = (exchange: Exchange) =>
  hasCompensation(exchange) ? exchange.compensation_paid_amount : 0;

/** 待退回金额：取消或拒绝后保留下来的已到账金额中尚未退回的部分 */
export const compensationRefundableAmount = (exchange: Exchange) => {
  if (!hasCompensation(exchange)) return 0;
  return Math.max(exchange.compensation_paid_amount - exchange.compensation_refunded_amount, 0);
};

/** 已退回金额 */
export const compensationRefundedAmount = (exchange: Exchange) =>
  hasCompensation(exchange) ? exchange.compensation_refunded_amount : 0;

/** 是否处于等待补款到账的阶段 */
export const isWaitingPayment = (exchange: Exchange) =>
  hasCompensation(exchange) && exchange.status === ExchangeStatus.PAYING;

export interface CompensationSummary {
  required: boolean;
  pending: number;
  paid: number;
  refundable: number;
  refunded: number;
}

/** 列表、详情、个人页共用的补款金额汇总（不区分查看者身份，金额对双方一致） */
export const summarizeCompensation = (exchange: Exchange): CompensationSummary => ({
  required: hasCompensation(exchange),
  pending: compensationPendingAmount(exchange),
  paid: compensationPaidAmount(exchange),
  refundable: compensationRefundableAmount(exchange),
  refunded: compensationRefundedAmount(exchange),
});
