export enum CompensationPayer {
  /** 发起方向物主补差价 */
  INITIATOR = 'initiator',
  /** 物主向发起方补差价 */
  OWNER = 'owner',
}

export enum CompensationStatus {
  /** 待补款：物主已同意，等待付款方到账 */
  PENDING = 'pending',
  /** 已到账：到账登记成功，交换进入交换中 */
  PAID = 'paid',
  /** 待退回：交换取消或拒绝，已到账金额保留待退回 */
  REFUNDING = 'refunding',
  /** 已退回：线下退回登记完成 */
  REFUNDED = 'refunded',
}

export const COMPENSATION_PAYER_OPTIONS = [
  { label: '我（发起方）补差价', value: CompensationPayer.INITIATOR },
  { label: '物主补差价', value: CompensationPayer.OWNER },
];

export const COMPENSATION_STATUS_OPTIONS = [
  { label: '待补款', value: CompensationStatus.PENDING },
  { label: '已到账', value: CompensationStatus.PAID },
  { label: '待退回', value: CompensationStatus.REFUNDING },
  { label: '已退回', value: CompensationStatus.REFUNDED },
];

/** 补款金额上限（元） */
export const COMPENSATION_AMOUNT_MAX = 100000;

export const COMPENSATION_STORAGE_HINTS = {
  statusKey: 'reswap:compensations',
  statusTouchedBy: [
    'models/compensation.ts',
    'models/exchange.ts',
    'api/compensationApi.ts',
    'api/exchangeApi.ts',
    'stores/exchangeStore.ts',
    'components/common/CompensationPanel.vue',
    'components/common/ExchangeCard.vue',
  ],
};
