import { ExchangeStatus } from './exchange';
import { ItemStatus } from './item';

export const PAGE_MESSAGES = {
  homeEmpty: '暂时没有符合条件的闲置物品',
  publishReady: '发布后会同步写入 localStorage 和 IndexedDB',
  exchangeEmpty: '还没有交换请求，先去首页挑一件合眼缘的物品',
  profileUpdated: '个人资料已更新',
  compensationHint: '双方物品价值不等时，可约定由一方向另一方补差价；一笔交换只登记一笔补款',
  compensationNone: '本次交换无需补款',
  compensationPendingPayment: '补款待付，请付款方尽快转账并由对方登记到账',
  compensationPaid: '补款已到账，交换进行中',
  compensationRefunding: '已到账补款待退回，请线下退款后登记退回',
  compensationRefunded: '补款已全部退回',
  exchangeDetailNotFound: '交换请求不存在，可能已被清理',
};

export const FORM_MESSAGES = {
  requiredTitle: '物品标题不能为空',
  requiredDescription: '请描述你希望交换的物品',
  requiredPhone: '请填写联系方式',
  imageLimit: '最多上传 4 张图片',
  exchangeNeedOwnItem: '请先发布一件可交换物品',
  compensationNeedPayer: '请选择补差付款方',
  compensationAmountInvalid: '请填写补差金额',
  compensationAmountPositive: '补差金额必须大于 0',
  compensationAmountPrecision: '补差金额最多保留两位小数',
  compensationAlreadyPaid: '该交换的补款已登记到账，一笔交换只认一笔补款，不能重复登记',
  compensationAlreadyRefunded: '该交换的补款已全部退回，不能重复登记',
  compensationNotReceived: '还没有已到账的补款，无需退回',
  compensationNotPending: '当前没有待登记的补款',
};

export const LOG_MESSAGES = {
  storageHydrated: 'storage hydrated with status maps',
  itemStatusUsed: `ItemStatus includes ${ItemStatus.AVAILABLE}, ${ItemStatus.EXCHANGED}, ${ItemStatus.OFFLINE}`,
  exchangeStatusUsed: `ExchangeStatus includes ${ExchangeStatus.PENDING}, ${ExchangeStatus.PAYING}, ${ExchangeStatus.ACCEPTED}, ${ExchangeStatus.REJECTED}, ${ExchangeStatus.CANCELLED}, ${ExchangeStatus.COMPLETED}`,
};

export const STATUS_MESSAGE_MAP = {
  [ItemStatus.AVAILABLE]: '这件物品可发起交换',
  [ItemStatus.EXCHANGED]: '这件物品已完成交换',
  [ItemStatus.OFFLINE]: '这件物品已下架',
  [ExchangeStatus.PENDING]: '等待对方确认',
  [ExchangeStatus.PAYING]: '物主已同意，等待补款到账',
  [ExchangeStatus.ACCEPTED]: '补款已结清，交换进行中',
  [ExchangeStatus.REJECTED]: '交换请求已拒绝',
  [ExchangeStatus.CANCELLED]: '交换已取消，已到账补款保留为待退回',
  [ExchangeStatus.COMPLETED]: '交换流程已完成',
};
