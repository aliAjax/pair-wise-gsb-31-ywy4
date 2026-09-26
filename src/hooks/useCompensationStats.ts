import { computed, type ComputedRef } from 'vue';

import type { Compensation } from '@/models/compensation';
import type { Exchange } from '@/models/exchange';
import { getCompensationView } from '@/utils/compensation';

export interface CompensationTotals {
  /** 待付（我作为付款方、还没到账的金额合计） */
  toPay: number;
  /** 已付（我作为付款方、已到账金额合计） */
  paid: number;
  /** 待退回（我已付但交换取消/拒绝、尚未退回） */
  refunding: number;
  /** 已退回 */
  refunded: number;
  /** 待收（我作为收款方、等待到账） */
  toReceive: number;
  /** 已收（我作为收款方、已到账） */
  received: number;
  /** 待退还（我已收、需要退回给付款方） */
  toReturn: number;
}

/**
 * 个人页补款金额汇总：当前用户相关的全部交换。
 * 列表/详情通过 getCompensationView 取单笔金额，这里只做个人页合计。
 */
export const useCompensationStats = (
  exchanges: () => Exchange[],
  compensations: () => Compensation[],
  userId: () => string | undefined,
): ComputedRef<CompensationTotals> =>
  computed(() => {
    const totals: CompensationTotals = {
      toPay: 0,
      paid: 0,
      refunding: 0,
      refunded: 0,
      toReceive: 0,
      received: 0,
      toReturn: 0,
    };
    const currentUserId = userId();
    if (!currentUserId) return totals;

    const compensationMap = new Map(compensations().map((item) => [item.exchange_id, item]));
    exchanges().forEach((exchange) => {
      const involved =
        exchange.from_user_id === currentUserId || exchange.to_user_id === currentUserId;
      if (!involved) return;
      const view = getCompensationView(exchange, compensationMap.get(exchange.id) ?? null, currentUserId);
      if (!view) return;
      if (view.role === 'payer') {
        totals.toPay += view.pendingAmount;
        totals.paid += view.paidTotal;
        totals.refunding += view.refundingAmount;
        totals.refunded += view.refundTotal;
      } else {
        totals.toReceive += view.pendingAmount;
        totals.received += view.paidTotal;
        totals.toReturn += view.refundingAmount;
      }
    });

    return totals;
  });
