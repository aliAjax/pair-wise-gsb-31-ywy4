import { CompensationStatus } from './compensation';
import { ExchangeStatus } from './exchange';
import { ItemStatus } from './item';

export const PAGE_MESSAGES = {
  homeEmpty: '暂时没有符合条件的闲置物品',
  publishReady: '发布后会同步写入 localStorage 和 IndexedDB',
  exchangeEmpty: '还没有交换请求，先去首页挑一件合眼缘的物品',
  profileUpdated: '个人资料已更新',
  exchangeNotFound: '交换请求不存在或已被清理',
};

export const FORM_MESSAGES = {
  requiredTitle: '物品标题不能为空',
  requiredDescription: '请描述你希望交换的物品',
  requiredPhone: '请填写联系方式',
  imageLimit: '最多上传 4 张图片',
  exchangeNeedOwnItem: '请先发布一件可交换物品',
  compensationRequired: '请选择补款付款方并填写金额',
  compensationAmountPositive: '补款金额必须大于 0',
  compensationAmountPrecision: '补款金额最多两位小数',
  compensationAmountLimit: '补款金额超出上限',
};

export const LOG_MESSAGES = {
  storageHydrated: 'storage hydrated with status maps',
  itemStatusUsed: `ItemStatus includes ${ItemStatus.AVAILABLE}, ${ItemStatus.EXCHANGED}, ${ItemStatus.OFFLINE}`,
  exchangeStatusUsed: `ExchangeStatus includes ${ExchangeStatus.PENDING}, ${ExchangeStatus.AWAITING_PAYMENT}, ${ExchangeStatus.ACCEPTED}, ${ExchangeStatus.REJECTED}, ${ExchangeStatus.COMPLETED}, ${ExchangeStatus.CANCELLED}`,
  compensationStatusUsed: `CompensationStatus includes ${CompensationStatus.PENDING}, ${CompensationStatus.PAID}, ${CompensationStatus.REFUNDING}, ${CompensationStatus.REFUNDED}`,
};

export const STATUS_MESSAGE_MAP = {
  item: {
    [ItemStatus.AVAILABLE]: '这件物品可发起交换',
    [ItemStatus.EXCHANGED]: '这件物品已完成交换',
    [ItemStatus.OFFLINE]: '这件物品已下架',
  },
  exchange: {
    [ExchangeStatus.PENDING]: '等待对方确认',
    [ExchangeStatus.AWAITING_PAYMENT]: '物主已同意，等待补款到账',
    [ExchangeStatus.ACCEPTED]: '交换已同意，可确认完成',
    [ExchangeStatus.REJECTED]: '交换请求已拒绝',
    [ExchangeStatus.COMPLETED]: '交换流程已完成',
    [ExchangeStatus.CANCELLED]: '交换已取消，已到账补款待退回',
  },
  compensation: {
    [CompensationStatus.PENDING]: '待补款：付款方转账后由收款方登记到账',
    [CompensationStatus.PAID]: '补款已到账',
    [CompensationStatus.REFUNDING]: '已到账补款保留中，等待线下退回',
    [CompensationStatus.REFUNDED]: '补款已退回',
  },
};
