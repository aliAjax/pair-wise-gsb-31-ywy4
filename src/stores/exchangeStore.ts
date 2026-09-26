import { defineStore } from 'pinia';

import { exchangeApi } from '@/api/exchangeApi';
import { ExchangeStatus } from '@/constants/exchange';
import type { Exchange, ExchangeDraft } from '@/models/exchange';
import { message } from '@/utils/message';

export const useExchangeStore = defineStore('exchanges', {
  state: () => ({
    exchanges: [] as Exchange[],
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
  },
  actions: {
    async hydrate() {
      this.loading = true;
      try {
        this.exchanges = await exchangeApi.list();
      } finally {
        this.loading = false;
      }
    },
    async create(draft: ExchangeDraft) {
      const exchange = await exchangeApi.create({ ...draft, status: ExchangeStatus.PENDING });
      this.exchanges = await exchangeApi.list();
      message(
        exchange.compensation_amount > 0 ? '交换请求已发出，等待物主确认补款方案' : '交换请求已发出',
        'success',
      );
      return exchange;
    },
    async accept(id: string) {
      const exchange = await exchangeApi.accept(id);
      this.exchanges = await exchangeApi.list();
      message(
        exchange.status === ExchangeStatus.PAYING ? '已同意交换，请等待补款到账' : '已同意交换',
        'success',
      );
    },
    async reject(id: string) {
      await exchangeApi.transition(id, ExchangeStatus.REJECTED);
      this.exchanges = await exchangeApi.list();
      message('已拒绝交换，已到账补款保留为待退回', 'success');
    },
    async cancel(id: string) {
      await exchangeApi.transition(id, ExchangeStatus.CANCELLED);
      this.exchanges = await exchangeApi.list();
      message('交换已取消，已到账补款保留为待退回', 'success');
    },
    /** 收款人确认补款到账：登记成功后才进入交换中，重复登记不累加 */
    async registerPayment(id: string) {
      await exchangeApi.registerPayment(id);
      this.exchanges = await exchangeApi.list();
      message('补款到账已登记，交换进入进行中', 'success');
    },
    /** 线下退款后登记：核销待退回金额 */
    async registerRefund(id: string) {
      await exchangeApi.registerRefund(id);
      this.exchanges = await exchangeApi.list();
      message('退款已登记，待退回金额已核销', 'success');
    },
    async complete(id: string) {
      await exchangeApi.transition(id, ExchangeStatus.COMPLETED);
      this.exchanges = await exchangeApi.list();
      message('交换已完成，双方物品状态已更新', 'success');
    },
  },
});
