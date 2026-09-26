import { compensationApi } from './compensationApi';
import { itemApi } from './itemApi';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { CompensationPayer, CompensationStatus } from '@/constants/compensation';
import { ExchangeStatus, resolveAcceptTarget, assertExchangeTransition } from '@/constants/exchange';
import { ItemStatus } from '@/constants/item';
import type { Compensation } from '@/models/compensation';
import { normalizeExchange, type Exchange, type ExchangeDraft } from '@/models/exchange';
import { resolveCompensationUsers } from '@/utils/compensation';

const now = Date.now();
const hoursAgo = (hours: number) => new Date(now - 1000 * 60 * 60 * hours).toISOString();

const seedExchanges: Exchange[] = [
  {
    id: 'exchange_seed',
    from_user_id: 'user_me',
    to_user_id: 'user_lin',
    from_item_id: 'item_chair',
    to_item_id: 'item_camera',
    status: ExchangeStatus.PENDING,
    message: '露营椅换拍立得，可以同城当面交换。',
    created_at: hoursAgo(1),
    updated_at: hoursAgo(1),
    // 旧请求：没有 compensation 字段，按无需补款处理
  },
  {
    id: 'exchange_seed_pay',
    from_user_id: 'user_me',
    to_user_id: 'user_chen',
    from_item_id: 'item_kettle',
    to_item_id: 'item_books',
    status: ExchangeStatus.AWAITING_PAYMENT,
    message: '我补一点差价，书籍对我更有用。',
    created_at: hoursAgo(5),
    updated_at: hoursAgo(2),
    compensation: { amount: 35, payer: CompensationPayer.INITIATOR },
  },
  {
    id: 'exchange_seed_accepted',
    from_user_id: 'user_chen',
    to_user_id: 'user_me',
    from_item_id: 'item_headphone',
    to_item_id: 'item_shoes',
    status: ExchangeStatus.ACCEPTED,
    message: '耳机成色不错，我补差价换跑鞋。',
    created_at: hoursAgo(30),
    updated_at: hoursAgo(20),
    compensation: { amount: 60, payer: CompensationPayer.INITIATOR },
  },
  {
    id: 'exchange_seed_refund',
    from_user_id: 'user_me',
    to_user_id: 'user_lin',
    from_item_id: 'item_board',
    to_item_id: 'item_plant',
    status: ExchangeStatus.CANCELLED,
    message: '临时换不了，取消交换。',
    created_at: hoursAgo(80),
    updated_at: hoursAgo(70),
    compensation: { amount: 45, payer: CompensationPayer.INITIATOR },
  },
];

const seedCompensations: Compensation[] = [
  (() => {
    const { payerUserId, payeeUserId } = resolveCompensationUsers(
      CompensationPayer.INITIATOR,
      'user_me',
      'user_chen',
    );
    return {
      id: 'comp_seed_pay',
      exchange_id: 'exchange_seed_pay',
      amount: 35,
      payer: CompensationPayer.INITIATOR,
      payer_user_id: payerUserId,
      payee_user_id: payeeUserId,
      status: CompensationStatus.PENDING,
      paid_amount: 0,
      refunded_amount: 0,
      paid_at: null,
      refunded_at: null,
      created_at: hoursAgo(2),
      updated_at: hoursAgo(2),
    };
  })(),
  (() => {
    const { payerUserId, payeeUserId } = resolveCompensationUsers(
      CompensationPayer.INITIATOR,
      'user_chen',
      'user_me',
    );
    return {
      id: 'comp_seed_accepted',
      exchange_id: 'exchange_seed_accepted',
      amount: 60,
      payer: CompensationPayer.INITIATOR,
      payer_user_id: payerUserId,
      payee_user_id: payeeUserId,
      status: CompensationStatus.PAID,
      paid_amount: 60,
      refunded_amount: 0,
      paid_at: hoursAgo(20),
      refunded_at: null,
      created_at: hoursAgo(20),
      updated_at: hoursAgo(20),
    };
  })(),
  (() => {
    const { payerUserId, payeeUserId } = resolveCompensationUsers(
      CompensationPayer.INITIATOR,
      'user_me',
      'user_lin',
    );
    return {
      id: 'comp_seed_refund',
      exchange_id: 'exchange_seed_refund',
      amount: 45,
      payer: CompensationPayer.INITIATOR,
      payer_user_id: payerUserId,
      payee_user_id: payeeUserId,
      status: CompensationStatus.REFUNDING,
      paid_amount: 45,
      refunded_amount: 0,
      paid_at: hoursAgo(75),
      refunded_at: null,
      created_at: hoursAgo(80),
      updated_at: hoursAgo(70),
    };
  })(),
];

export const exchangeApi = {
  async list(): Promise<Exchange[]> {
    const exchanges = await storage.get<Exchange[]>(STORAGE_KEYS.exchanges, []);
    if (exchanges.length) return exchanges.map(normalizeExchange);
    await storage.set(STORAGE_KEYS.exchanges, seedExchanges);
    await storage.set(STORAGE_KEYS.compensations, seedCompensations);
    return seedExchanges.map(normalizeExchange);
  },

  async detail(id: string): Promise<Exchange | undefined> {
    const exchanges = await this.list();
    return exchanges.find((item) => item.id === id);
  },

  async create(draft: ExchangeDraft): Promise<Exchange> {
    const exchanges = await this.list();
    const targetItem = await itemApi.detail(draft.to_item_id);
    if (!targetItem || targetItem.status !== ItemStatus.AVAILABLE) {
      throw new Error('目标物品当前不可交换');
    }
    const nextExchange: Exchange = normalizeExchange({
      ...draft,
      id: storage.createId('exchange'),
      status: draft.status ?? ExchangeStatus.PENDING,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    await storage.set(STORAGE_KEYS.exchanges, [nextExchange, ...exchanges]);
    return nextExchange;
  },

  /**
   * 物主同意：
   * - 有补款约定 → 生成一笔待补款，交换进入“待补款”
   * - 无补款约定 → 直接进入“交换中”
   */
  async accept(id: string): Promise<Exchange> {
    const exchanges = await this.list();
    const current = exchanges.find((item) => item.id === id);
    if (!current) throw new Error('交换请求不存在');
    const proposal = current.compensation;
    const target = resolveAcceptTarget(Boolean(proposal?.amount));
    assertExchangeTransition(current.status, target);

    if (proposal?.amount) {
      const { payerUserId, payeeUserId } = resolveCompensationUsers(
        proposal.payer,
        current.from_user_id,
        current.to_user_id,
      );
      await compensationApi.create({
        exchange_id: current.id,
        amount: proposal.amount,
        payer: proposal.payer,
        payer_user_id: payerUserId,
        payee_user_id: payeeUserId,
      });
    }

    return this.persistStatus(id, target);
  },

  async reject(id: string): Promise<Exchange> {
    return this.close(id, ExchangeStatus.REJECTED);
  },

  async cancel(id: string): Promise<Exchange> {
    return this.close(id, ExchangeStatus.CANCELLED);
  },

  /**
   * 到账登记成功才进入交换中。
   * 一笔交换只认一笔补款；重复登记不累加——已到账/已在交换中时直接返回，
   * 不抛错（由 store 据此提示“已登记过”）。
   */
  async registerPayment(id: string): Promise<Exchange> {
    const exchanges = await this.list();
    const current = exchanges.find((item) => item.id === id);
    if (!current) throw new Error('交换请求不存在');
    const compensation = await compensationApi.findByExchange(id);
    const alreadyRegistered =
      compensation !== undefined &&
      (compensation.status === CompensationStatus.PAID || compensation.paid_amount > 0);
    if (alreadyRegistered) {
      return normalizeExchange(current.status === ExchangeStatus.ACCEPTED ? current : { ...current });
    }
    assertExchangeTransition(current.status, ExchangeStatus.ACCEPTED);
    await compensationApi.markPaid(id);
    return this.persistStatus(id, ExchangeStatus.ACCEPTED);
  },

  /** 退回登记：已取消/拒绝后保留的已到账金额标记为已退回 */
  async registerRefund(id: string): Promise<Compensation> {
    return compensationApi.markRefunded(id);
  },

  async complete(id: string): Promise<Exchange> {
    const exchanges = await this.list();
    const current = exchanges.find((item) => item.id === id);
    if (!current) throw new Error('交换请求不存在');
    assertExchangeTransition(current.status, ExchangeStatus.COMPLETED);
    const next = await this.persistStatus(id, ExchangeStatus.COMPLETED);
    await itemApi.setStatus(current.from_item_id, ItemStatus.EXCHANGED);
    await itemApi.setStatus(current.to_item_id, ItemStatus.EXCHANGED);
    return next;
  },

  /** 拒绝/取消：若已有到账补款，金额保留并转为待退回 */
  async close(id: string, status: ExchangeStatus.REJECTED | ExchangeStatus.CANCELLED): Promise<Exchange> {
    const exchanges = await this.list();
    const current = exchanges.find((item) => item.id === id);
    if (!current) throw new Error('交换请求不存在');
    assertExchangeTransition(current.status, status);
    const next = await this.persistStatus(id, status);
    await compensationApi.markRefunding(id);
    return next;
  },

  async persistStatus(id: string, status: ExchangeStatus): Promise<Exchange> {
    const exchanges = await this.list();
    const nextExchanges = exchanges.map((item) =>
      item.id === id ? { ...item, status, updated_at: new Date().toISOString() } : item,
    );
    await storage.set(STORAGE_KEYS.exchanges, nextExchanges);
    const next = nextExchanges.find((item) => item.id === id);
    if (!next) throw new Error('交换请求不存在');
    return normalizeExchange(next);
  },
};
