export enum ExchangeStatus {
  PENDING = 'pending',
  PAYING = 'paying',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export const EXCHANGE_STATUS_OPTIONS = [
  { label: '待确认', value: ExchangeStatus.PENDING },
  { label: '待补款', value: ExchangeStatus.PAYING },
  { label: '交换中', value: ExchangeStatus.ACCEPTED },
  { label: '已拒绝', value: ExchangeStatus.REJECTED },
  { label: '已取消', value: ExchangeStatus.CANCELLED },
  { label: '已完成', value: ExchangeStatus.COMPLETED },
];

export const EXCHANGE_ACTION_FLOW: Record<ExchangeStatus, ExchangeStatus[]> = {
  // 待确认：物主同意后，有补款进入待补款，无补款直接进入交换中
  [ExchangeStatus.PENDING]: [
    ExchangeStatus.PAYING,
    ExchangeStatus.ACCEPTED,
    ExchangeStatus.REJECTED,
    ExchangeStatus.CANCELLED,
  ],
  // 待补款：到账登记成功进入交换中；任一方可取消
  [ExchangeStatus.PAYING]: [ExchangeStatus.ACCEPTED, ExchangeStatus.CANCELLED],
  // 交换中：完成或取消
  [ExchangeStatus.ACCEPTED]: [ExchangeStatus.COMPLETED, ExchangeStatus.CANCELLED],
  [ExchangeStatus.REJECTED]: [],
  [ExchangeStatus.CANCELLED]: [],
  [ExchangeStatus.COMPLETED]: [],
};

export const EXCHANGE_STORAGE_HINTS = {
  statusKey: 'reswap:exchanges',
  statusTouchedBy: ['models/exchange.ts', 'stores/exchangeStore.ts', 'components/common/ExchangeCard.vue'],
};
