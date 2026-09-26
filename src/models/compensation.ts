import { CompensationPayer, CompensationStatus } from '@/constants/compensation';

/**
 * 补差额。一笔交换只认一笔补款（与 Exchange 一对一）。
 * 到账登记幂等：重复登记不累加，paid_amount 只会写入一次。
 */
export interface Compensation {
  id: string;
  exchange_id: string;
  /** 约定补款金额（元） */
  amount: number;
  /** 由谁付款 */
  payer: CompensationPayer;
  /** 付款方用户 id */
  payer_user_id: string;
  /** 收款方用户 id */
  payee_user_id: string;
  status: CompensationStatus;
  /** 已到账金额；登记成功一次后锁定，重复登记不累加 */
  paid_amount: number;
  /** 已退回金额 */
  refunded_amount: number;
  paid_at: string | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
}

/** 发起交换时写入的补款约定（物主同意后才生成待补款实体） */
export interface CompensationProposal {
  amount: number;
  payer: CompensationPayer;
}

export type CompensationDraft = Omit<
  Compensation,
  'id' | 'status' | 'paid_amount' | 'refunded_amount' | 'paid_at' | 'refunded_at' | 'created_at' | 'updated_at'
> & {
  status?: CompensationStatus;
};
