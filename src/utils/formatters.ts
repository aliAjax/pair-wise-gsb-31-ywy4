import dayjs from 'dayjs';

import { CompensationStatus } from '@/constants/compensation';
import { ExchangeStatus } from '@/constants/exchange';
import { ItemCondition, ItemStatus } from '@/constants/item';
import { STATUS_MESSAGE_MAP } from '@/constants/messages';
import type { CompensationRole } from '@/utils/compensation';
export const formatDate = (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm');

export const formatMoney = (amount: number) => `¥${Number(amount || 0).toFixed(2)}`;

export const formatItemStatus = (status: ItemStatus) => {
  const map: Record<ItemStatus, string> = {
    [ItemStatus.AVAILABLE]: '可交换',
    [ItemStatus.EXCHANGED]: '已交换',
    [ItemStatus.OFFLINE]: '已下架',
  };
  return map[status];
};

export const formatExchangeStatus = (status: ExchangeStatus) => {
  const map: Record<ExchangeStatus, string> = {
    [ExchangeStatus.PENDING]: '待确认',
    [ExchangeStatus.AWAITING_PAYMENT]: '待补款',
    [ExchangeStatus.ACCEPTED]: '交换中',
    [ExchangeStatus.REJECTED]: '已拒绝',
    [ExchangeStatus.COMPLETED]: '已完成',
    [ExchangeStatus.CANCELLED]: '已取消',
  };
  return map[status];
};

export const formatCompensationStatus = (status: CompensationStatus, role: CompensationRole = 'payer') => {
  const map: Record<CompensationStatus, Record<CompensationRole, string>> = {
    [CompensationStatus.PENDING]: { payer: '待付款', payee: '待收款' },
    [CompensationStatus.PAID]: { payer: '已付款', payee: '已收款' },
    [CompensationStatus.REFUNDING]: { payer: '待退回', payee: '待退还' },
    [CompensationStatus.REFUNDED]: { payer: '已退回', payee: '已退还' },
  };
  return map[status][role];
};

export const formatCondition = (condition: ItemCondition) => {
  const map: Record<ItemCondition, string> = {
    [ItemCondition.NEW]: '全新',
    [ItemCondition.LIKE_NEW]: '九成新',
    [ItemCondition.GOOD]: '八成新',
    [ItemCondition.WORN]: '战损',
  };
  return map[condition];
};

export const formatCreditLevel = (score: number) => {
  if (score >= 90) return '守约达人';
  if (score >= 75) return '稳定交换';
  if (score >= 60) return '新晋用户';
  return '需谨慎';
};

export const statusToneClass = (status: ItemStatus | ExchangeStatus | CompensationStatus) => {
  if (status === ItemStatus.AVAILABLE || status === ExchangeStatus.ACCEPTED || status === CompensationStatus.PAID) {
    return 'status-good';
  }
  if (status === ItemStatus.OFFLINE || status === ExchangeStatus.REJECTED || status === ExchangeStatus.CANCELLED) {
    return 'status-muted';
  }
  if (status === ItemStatus.EXCHANGED || status === ExchangeStatus.COMPLETED || status === CompensationStatus.REFUNDED) {
    return 'status-done';
  }
  if (status === CompensationStatus.REFUNDING) return 'status-refund';
  return 'status-wait';
};

export function formatStatusMessage(status: ItemStatus | ExchangeStatus): string {
  if (
    status === ExchangeStatus.PENDING ||
    status === ExchangeStatus.AWAITING_PAYMENT ||
    status === ExchangeStatus.ACCEPTED ||
    status === ExchangeStatus.REJECTED ||
    status === ExchangeStatus.COMPLETED ||
    status === ExchangeStatus.CANCELLED
  ) {
    return STATUS_MESSAGE_MAP.exchange[status as ExchangeStatus];
  }
  return STATUS_MESSAGE_MAP.item[status as ItemStatus];
}

/** 补款状态文案（补款枚举与交换枚举都含 pending，需独立取词） */
export const formatCompensationMessage = (status: CompensationStatus) =>
  STATUS_MESSAGE_MAP.compensation[status];
