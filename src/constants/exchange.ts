import { CompensationStatus } from './compensation';

export enum ExchangeStatus {
  PENDING = 'pending',
  /** 物主已同意，等待补差额到账（有补款时的交换前置状态） */
  AWAITING_PAYMENT = 'awaiting_payment',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export const EXCHANGE_STATUS_OPTIONS = [
  { label: '待确认', value: ExchangeStatus.PENDING },
  { label: '待补款', value: ExchangeStatus.AWAITING_PAYMENT },
  { label: '已同意', value: ExchangeStatus.ACCEPTED },
  { label: '已拒绝', value: ExchangeStatus.REJECTED },
  { label: '已完成', value: ExchangeStatus.COMPLETED },
  { label: '已取消', value: ExchangeStatus.CANCELLED },
];

/**
 * 补款驱动的交换状态机：
 * - PENDING → AWAITING_PAYMENT（有补款，物主同意先生成待补款）
 * - PENDING → ACCEPTED（无补款，物主同意直接进入交换中）
 * - PENDING → REJECTED / CANCELLED
 * - AWAITING_PAYMENT → ACCEPTED（到账登记成功才进入交换中）/ CANCELLED
 * - ACCEPTED → COMPLETED / CANCELLED
 */
export const EXCHANGE_ACTION_FLOW: Record<ExchangeStatus, ExchangeStatus[]> = {
  [ExchangeStatus.PENDING]: [
    ExchangeStatus.AWAITING_PAYMENT,
    ExchangeStatus.ACCEPTED,
    ExchangeStatus.REJECTED,
    ExchangeStatus.CANCELLED,
  ],
  [ExchangeStatus.AWAITING_PAYMENT]: [ExchangeStatus.ACCEPTED, ExchangeStatus.CANCELLED],
  [ExchangeStatus.ACCEPTED]: [ExchangeStatus.COMPLETED, ExchangeStatus.CANCELLED],
  [ExchangeStatus.REJECTED]: [],
  [ExchangeStatus.COMPLETED]: [],
  [ExchangeStatus.CANCELLED]: [],
};

export const assertExchangeTransition = (from: ExchangeStatus, to: ExchangeStatus) => {
  if (!EXCHANGE_ACTION_FLOW[from].includes(to)) {
    throw new Error('当前状态不允许该操作');
  }
};

/** 物主“同意”动作落到的目标状态 */
export const resolveAcceptTarget = (hasCompensation: boolean) =>
  hasCompensation ? ExchangeStatus.AWAITING_PAYMENT : ExchangeStatus.ACCEPTED;

/** 到账登记 / 取消拒绝后，补款状态对应的提示 */
export const COMPENSATION_FLOW_HINTS: Partial<Record<ExchangeStatus, CompensationStatus>> = {
  [ExchangeStatus.AWAITING_PAYMENT]: CompensationStatus.PENDING,
};

export const EXCHANGE_STORAGE_HINTS = {
  statusKey: 'reswap:exchanges',
  statusTouchedBy: [
    'models/exchange.ts',
    'stores/exchangeStore.ts',
    'components/common/ExchangeCard.vue',
    'components/common/CompensationPanel.vue',
  ],
};
