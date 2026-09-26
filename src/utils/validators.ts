import type { ItemDraft } from '@/models/item';
import type { UserDraft } from '@/models/user';

import { FORM_MESSAGES } from '@/constants/messages';

export const validateItemDraft = (draft: Partial<ItemDraft>) => {
  if (!draft.title?.trim()) return FORM_MESSAGES.requiredTitle;
  if (!draft.description?.trim()) return FORM_MESSAGES.requiredDescription;
  return '';
};

export const validateUserDraft = (draft: Partial<UserDraft>) => {
  if (!draft.nickname?.trim()) return '昵称不能为空';
  if (!draft.phone?.trim()) return FORM_MESSAGES.requiredPhone;
  return '';
};

/** 发起交换时的补差校验：需要补款时必须明确付款方且金额大于 0 */
export const validateCompensation = (compensationEnabled: boolean, amountInput: string, payerId: string) => {
  if (!compensationEnabled) return '';
  if (!payerId) return FORM_MESSAGES.compensationNeedPayer;
  const amount = Number(amountInput);
  if (!amountInput.trim() || Number.isNaN(amount)) return FORM_MESSAGES.compensationAmountInvalid;
  if (amount <= 0) return FORM_MESSAGES.compensationAmountPositive;
  if (!/^\d+(\.\d{1,2})?$/.test(amountInput.trim())) return FORM_MESSAGES.compensationAmountPrecision;
  return '';
};
