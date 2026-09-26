import { computed } from 'vue';

import { ExchangeStatus } from '@/constants/exchange';
import type { Exchange } from '@/models/exchange';
import {
  compensationAmount,
  compensationPaidAmount,
  compensationPendingAmount,
  compensationRefundableAmount,
  compensationRefundedAmount,
  hasCompensation,
  isCompensationPayer,
} from '@/utils/compensation';

/**
 * 个人页补款汇总：以当前用户身份分别统计
 * - 作为付款方：待付 / 已付 / 已退回
 * - 作为收款方：待收 / 已收 / 待退回
 */
export const useCompensationStats = (exchanges: () => Exchange[], userId: () => string | null | undefined) => {
  return computed(() => {
    const list = exchanges().filter(hasCompensation);
    const sum = (predicate: (exchange: Exchange) => boolean, picker: (exchange: Exchange) => number) =>
      list.filter(predicate).reduce((total, exchange) => total + picker(exchange), 0);

    const asPayer = (exchange: Exchange) => isCompensationPayer(exchange, userId());
    const asPayee = (exchange: Exchange) => hasCompensation(exchange) && !asPayer(exchange);
    const isPending = (exchange: Exchange) => exchange.status === ExchangeStatus.PAYING;

    return {
      payerPending: sum(asPayer, (exchange) => (isPending(exchange) ? compensationPendingAmount(exchange) : 0)),
      payerPaid: sum(asPayer, compensationPaidAmount),
      payerRefunded: sum(asPayer, compensationRefundedAmount),
      payerRefundable: sum(asPayer, compensationRefundableAmount),
      payeePending: sum(asPayee, (exchange) => (isPending(exchange) ? compensationPendingAmount(exchange) : 0)),
      payeeReceived: sum(asPayee, compensationPaidAmount),
      payeeRefundable: sum(asPayee, compensationRefundableAmount),
      payeeRefunded: sum(asPayee, compensationRefundedAmount),
      total: list.length,
    };
  });
};
