import { EXCHANGE_ACTION_FLOW, ExchangeStatus } from '@/constants/exchange';
import { ItemStatus } from '@/constants/item';
import { FORM_MESSAGES } from '@/constants/messages';
import type { Exchange, ExchangeDraft } from '@/models/exchange';

import { itemApi } from './itemApi';
import { storage, STORAGE_KEYS } from '@/utils/storage';

const seedExchanges: Exchange[] = [
  {
    id: 'exchange_seed',
    from_user_id: 'user_me',
    to_user_id: 'user_lin',
    from_item_id: 'item_chair',
    to_item_id: 'item_camera',
    status: ExchangeStatus.PENDING,
    message: '露营椅换拍立得，可以同城当面交换。',
    compensation_amount: 0,
    compensation_payer_id: null,
    compensation_paid_amount: 0,
    compensation_refunded_amount: 0,
    compensation_paid_at: null,
    compensation_refunded_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
];

/** 旧请求没有补款字段，统一按无需补款补齐 */
const normalizeExchange = (raw: Exchange): Exchange => ({
  ...raw,
  compensation_amount: raw.compensation_amount ?? 0,
  compensation_payer_id: raw.compensation_payer_id ?? null,
  compensation_paid_amount: raw.compensation_paid_amount ?? 0,
  compensation_refunded_amount: raw.compensation_refunded_amount ?? 0,
  compensation_paid_at: raw.compensation_paid_at ?? null,
  compensation_refunded_at: raw.compensation_refunded_at ?? null,
});

const persist = async (exchanges: Exchange[]) => storage.set(STORAGE_KEYS.exchanges, exchanges);

export const exchangeApi = {
  async list(): Promise<Exchange[]> {
    const exchanges = await storage.get<Exchange[]>(STORAGE_KEYS.exchanges, []);
    if (exchanges.length) {
      const normalized = exchanges.map(normalizeExchange);
      const needMigration = normalized.some(
        (exchange, index) =>
          exchange.compensation_amount !== exchanges[index]?.compensation_amount ||
          exchange.compensation_payer_id !== exchanges[index]?.compensation_payer_id,
      );
      if (needMigration) await persist(normalized);
      return normalized;
    }
    await persist(seedExchanges);
    return seedExchanges;
  },

  async create(draft: ExchangeDraft): Promise<Exchange> {
    const exchanges = await this.list();
    const targetItem = await itemApi.detail(draft.to_item_id);
    if (!targetItem || targetItem.status !== ItemStatus.AVAILABLE) {
      throw new Error('目标物品当前不可交换');
    }
    const nextExchange: Exchange = {
      ...draft,
      id: storage.createId('exchange'),
      status: draft.status ?? ExchangeStatus.PENDING,
      compensation_paid_amount: 0,
      compensation_refunded_amount: 0,
      compensation_paid_at: null,
      compensation_refunded_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await persist([nextExchange, ...exchanges]);
    return nextExchange;
  },

  async transition(id: string, status: ExchangeStatus): Promise<Exchange> {
    const exchanges = await this.list();
    const current = exchanges.find((item) => item.id === id);
    if (!current) throw new Error('交换请求不存在');
    if (!EXCHANGE_ACTION_FLOW[current.status].includes(status)) {
      throw new Error('当前状态不允许该操作');
    }
    const nextExchange: Exchange = { ...current, status, updated_at: new Date().toISOString() };
    if (status === ExchangeStatus.COMPLETED) {
      await itemApi.setStatus(current.from_item_id, ItemStatus.EXCHANGED);
      await itemApi.setStatus(current.to_item_id, ItemStatus.EXCHANGED);
    }
    await persist(exchanges.map((item) => (item.id === id ? nextExchange : item)));
    return nextExchange;
  },

  /** 物主同意：需要补款先生成待补款（进入待补款状态），否则直接进入交换中 */
  async accept(id: string): Promise<Exchange> {
    const exchanges = await this.list();
    const current = exchanges.find((item) => item.id === id);
    if (!current) throw new Error('交换请求不存在');
    if (!EXCHANGE_ACTION_FLOW[current.status].includes(ExchangeStatus.PAYING)) {
      throw new Error('当前状态不允许该操作');
    }
    const nextStatus =
      current.compensation_amount > 0 && current.compensation_payer_id
        ? ExchangeStatus.PAYING
        : ExchangeStatus.ACCEPTED;
    const nextExchange: Exchange = { ...current, status: nextStatus, updated_at: new Date().toISOString() };
    await persist(exchanges.map((item) => (item.id === id ? nextExchange : item)));
    return nextExchange;
  },

  /** 到账登记：一笔交换只认一笔补款，重复登记不累加 */
  async registerPayment(id: string): Promise<Exchange> {
    const exchanges = await this.list();
    const current = exchanges.find((item) => item.id === id);
    if (!current) throw new Error('交换请求不存在');
    if (!(current.compensation_amount > 0) || !current.compensation_payer_id) {
      throw new Error(FORM_MESSAGES.compensationNotPending);
    }
    if (current.compensation_paid_amount >= current.compensation_amount) {
      throw new Error(FORM_MESSAGES.compensationAlreadyPaid);
    }
    if (current.status !== ExchangeStatus.PAYING) {
      throw new Error('当前状态不允许登记到账');
    }
    const registeredAt = new Date().toISOString();
    const nextExchange: Exchange = {
      ...current,
      // 一次性按约定金额登记到账，不接收外部金额，重复登记会被上面拦截
      compensation_paid_amount: current.compensation_amount,
      compensation_paid_at: registeredAt,
      status: ExchangeStatus.ACCEPTED,
      updated_at: registeredAt,
    };
    await persist(exchanges.map((item) => (item.id === id ? nextExchange : item)));
    return nextExchange;
  },

  /** 退回登记：取消或拒绝后已到账金额保留为待退回，登记后从待退回中核销 */
  async registerRefund(id: string): Promise<Exchange> {
    const exchanges = await this.list();
    const current = exchanges.find((item) => item.id === id);
    if (!current) throw new Error('交换请求不存在');
    if (!(current.compensation_amount > 0) || !current.compensation_payer_id) {
      throw new Error(FORM_MESSAGES.compensationNotReceived);
    }
    if (current.compensation_paid_amount <= 0) {
      throw new Error(FORM_MESSAGES.compensationNotReceived);
    }
    if (current.compensation_refunded_amount >= current.compensation_paid_amount) {
      throw new Error(FORM_MESSAGES.compensationAlreadyRefunded);
    }
    if (![ExchangeStatus.CANCELLED, ExchangeStatus.REJECTED].includes(current.status)) {
      throw new Error('只有取消或拒绝后的交换才能登记退回');
    }
    const registeredAt = new Date().toISOString();
    const nextExchange: Exchange = {
      ...current,
      compensation_refunded_amount: current.compensation_paid_amount,
      compensation_refunded_at: registeredAt,
      updated_at: registeredAt,
    };
    await persist(exchanges.map((item) => (item.id === id ? nextExchange : item)));
    return nextExchange;
  },
};
