import { CompensationStatus } from '@/constants/compensation';
import { ExchangeStatus } from '@/constants/exchange';
import type { Compensation, CompensationDraft } from '@/models/compensation';

import { storage, STORAGE_KEYS } from '@/utils/storage';

/**
 * 补款 API：一笔交换只认一笔补款。
 * 到账/退回登记均为幂等动作——重复登记不累加金额，只更新一次。
 */
export const compensationApi = {
  async list(): Promise<Compensation[]> {
    return storage.get<Compensation[]>(STORAGE_KEYS.compensations, []);
  },

  async findByExchange(exchangeId: string): Promise<Compensation | undefined> {
    const compensations = await this.list();
    return compensations.find((item) => item.exchange_id === exchangeId);
  },

  /** 物主同意时生成待补款；已存在则不重复创建（一笔交换只认一笔补款） */
  async create(draft: CompensationDraft): Promise<Compensation> {
    const compensations = await this.list();
    const existing = compensations.find((item) => item.exchange_id === draft.exchange_id);
    if (existing) return existing;
    const next: Compensation = {
      ...draft,
      id: storage.createId('compensation'),
      status: draft.status ?? CompensationStatus.PENDING,
      paid_amount: 0,
      refunded_amount: 0,
      paid_at: null,
      refunded_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await storage.set(STORAGE_KEYS.compensations, [next, ...compensations]);
    return next;
  },

  /**
   * 到账登记：把约定金额一次性锁定为已到账。
   * 重复登记不累加——已经到账过的补款再次登记直接返回原记录。
   */
  async markPaid(exchangeId: string): Promise<Compensation> {
    const compensations = await this.list();
    const current = compensations.find((item) => item.exchange_id === exchangeId);
    if (!current) throw new Error('补款记录不存在');
    if (current.status === CompensationStatus.PAID || current.paid_amount > 0) {
      return current;
    }
    if (current.status !== CompensationStatus.PENDING) {
      throw new Error('当前补款状态不允许登记到账');
    }
    const next: Compensation = {
      ...current,
      status: CompensationStatus.PAID,
      paid_amount: current.amount,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await storage.set(
      STORAGE_KEYS.compensations,
      compensations.map((item) => (item.id === current.id ? next : item)),
    );
    return next;
  },

  /**
   * 交换取消或拒绝后，已到账金额保留并转为待退回；
   * 没有到账的待补款不保留金额。
   */
  async markRefunding(exchangeId: string): Promise<Compensation | null> {
    const compensations = await this.list();
    const current = compensations.find((item) => item.exchange_id === exchangeId);
    if (!current) return null;
    if (current.paid_amount <= 0) return current;
    if (current.status === CompensationStatus.REFUNDING || current.status === CompensationStatus.REFUNDED) {
      return current;
    }
    const next: Compensation = {
      ...current,
      status: CompensationStatus.REFUNDING,
      updated_at: new Date().toISOString(),
    };
    await storage.set(
      STORAGE_KEYS.compensations,
      compensations.map((item) => (item.id === current.id ? next : item)),
    );
    return next;
  },

  /** 退回登记：幂等，重复登记不累加 */
  async markRefunded(exchangeId: string): Promise<Compensation> {
    const compensations = await this.list();
    const current = compensations.find((item) => item.exchange_id === exchangeId);
    if (!current) throw new Error('补款记录不存在');
    if (current.paid_amount <= 0) throw new Error('没有需要退回的到账金额');
    if (current.status === CompensationStatus.REFUNDED) return current;
    if (current.status !== CompensationStatus.REFUNDING) {
      throw new Error('当前补款状态不允许登记退回');
    }
    const next: Compensation = {
      ...current,
      status: CompensationStatus.REFUNDED,
      refunded_amount: current.paid_amount,
      refunded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await storage.set(
      STORAGE_KEYS.compensations,
      compensations.map((item) => (item.id === current.id ? next : item)),
    );
    return next;
  },
};

/** 取消/拒绝时对应的补款状态是否会保留已到账金额 */
export const shouldHoldCompensation = (exchangeStatus: ExchangeStatus) =>
  exchangeStatus === ExchangeStatus.CANCELLED || exchangeStatus === ExchangeStatus.REJECTED;
