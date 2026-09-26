import { CompensationPayer } from '@/constants/compensation';
import { ExchangeStatus } from '@/constants/exchange';

export interface Exchange {
  id: string;
  from_user_id: string;
  to_user_id: string;
  from_item_id: string;
  to_item_id: string;
  status: ExchangeStatus;
  message: string;
  created_at: string;
  updated_at: string;
  /**
   * 补款约定。发起交换时由发起方选择付款方并填写金额；
   * 旧请求没有该字段，按“无需补款”处理（normalized 为 null）。
   */
  compensation?: ExchangeCompensationProposal | null;
}

export interface ExchangeCompensationProposal {
  amount: number;
  payer: CompensationPayer;
}

export type ExchangeDraft = Omit<Exchange, 'id' | 'status' | 'created_at' | 'updated_at'> & {
  status?: ExchangeStatus;
};

/** 旧数据兼容：没有补款约定的请求按无需补款处理 */
export const normalizeExchange = (exchange: Exchange): Exchange => ({
  ...exchange,
  compensation: exchange.compensation?.amount ? exchange.compensation : null,
});
