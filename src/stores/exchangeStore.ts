import { defineStore } from 'pinia';

import { compensationApi } from '@/api/compensationApi';
import { exchangeApi } from '@/api/exchangeApi';
import { ExchangeStatus } from '@/constants/exchange';
import type { Compensation } from '@/models/compensation';
import type { Exchange, ExchangeDraft } from '@/models/exchange';
import { message } from '@/utils/message';

export const useExchangeStore = defineStore('exchanges', {
  state: () => ({
    exchanges: [] as Exchange[],
    compensations: [] as Compensation[],
    statusFilter: 'all' as ExchangeStatus | 'all',
    loading: false,
  }),
  getters: {
    sent: (state) => (userId: string) => state.exchanges.filter((item) => item.from_user_id === userId),
    received: (state) => (userId: string) => state.exchanges.filter((item) => item.to_user_id === userId),
    filtered: (state) => {
      if (state.statusFilter === 'all') return state.exchanges;
      return state.exchanges.filter((item) => item.status === state.statusFilter);
    },
    compensationOf: (state) => (exchangeId: string) =>
      state.compensations.find((item) => item.exchange_id === exchangeId) ?? null,
  },
  actions: {
    async hydrate() {
      this.loading = true;
      try {
        this.exchanges = await exchangeApi.list();
        this.compensations = await compensationApi.list();
      } finally {
        this.loading = false;
      }
    },
    async refresh() {
      this.exchanges = await exchangeApi.list();
      this.compensations = await compensationApi.list();
    },
    async create(draft: ExchangeDraft) {
      const exchange = await exchangeApi.create({ ...draft, status: ExchangeStatus.PENDING });
      await this.refresh();
      message(
        exchange.compensation?.amount ? '交换请求已发出，等待物主确认补款约定' : '交换请求已发出',
        'success',
      );
      return exchange;
    },
    /** 物主同意：有补款先生成待补款，无补款直接进入交换中 */
    async accept(id: string) {
      const exchange = await exchangeApi.accept(id);
      await this.refresh();
      message(
        exchange.status === ExchangeStatus.AWAITING_PAYMENT
          ? '已同意交换，已生成待补款，等待到账'
          : '已同意交换',
        'success',
      );
    },
    async reject(id: string) {
      await exchangeApi.reject(id);
      await this.refresh();
      message('已拒绝交换，已到账补款将保留待退回', 'success');
    },
    async cancel(id: string) {
      await exchangeApi.cancel(id);
      await this.refresh();
      message('交换已取消，已到账补款保留为待退回', 'success');
    },
    /** 到账登记成功才进入交换中；一笔交换只认一笔补款，重复登记不累加 */
    async registerPayment(id: string) {
      const before = this.compensationOf(id);
      const wasAlreadyRegistered = Boolean(before && (before.status === 'paid' || before.paid_amount > 0));
      await exchangeApi.registerPayment(id);
      await this.refresh();
      if (wasAlreadyRegistered) {
        message('这笔补款已登记过，无需重复登记', 'info');
      } else {
        message('补款已登记到账，交换进入交换中', 'success');
      }
    },
    async registerRefund(id: string) {
      await exchangeApi.registerRefund(id);
      await this.refresh();
      message('已登记退回', 'success');
    },
    async complete(id: string) {
      await exchangeApi.complete(id);
      await this.refresh();
      message('交换已完成，双方物品状态已更新', 'success');
    },
  },
});
