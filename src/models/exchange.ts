import { ExchangeStatus } from '@/constants/exchange';

export interface Exchange {
  id: string;
  from_user_id: string;
  to_user_id: string;
  from_item_id: string;
  to_item_id: string;
  status: ExchangeStatus;
  message: string;
  /** 补差金额（元），0 表示无需补款；一笔交换只认一笔补款 */
  compensation_amount: number;
  /** 补款方（谁付钱）；null 表示无需补款，旧请求统一按此处理 */
  compensation_payer_id: string | null;
  /** 已到账金额：物主同意后生成待补款，到账登记后写入；重复登记不累加 */
  compensation_paid_amount: number;
  /** 已退回金额：取消或拒绝后，已到账金额保留为待退回，退回登记后写入 */
  compensation_refunded_amount: number;
  /** 到账登记时间 */
  compensation_paid_at: string | null;
  /** 退回登记时间 */
  compensation_refunded_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ExchangeDraft = Omit<
  Exchange,
  | 'id'
  | 'status'
  | 'created_at'
  | 'updated_at'
  | 'compensation_paid_amount'
  | 'compensation_refunded_amount'
  | 'compensation_paid_at'
  | 'compensation_refunded_at'
> & {
  status?: ExchangeStatus;
};
