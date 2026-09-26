import { COMPENSATION_AMOUNT_MAX } from '@/constants/compensation';
import type { CompensationProposal } from '@/models/compensation';
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

/**
 * 补款约定校验。开启补款时必须有正数金额（最多两位小数）。
 * 返回错误文案；'' 表示通过。
 */
export const validateCompensationProposal = (enabled: boolean, proposal: CompensationProposal | null) => {
  if (!enabled) return '';
  if (!proposal) return FORM_MESSAGES.compensationRequired;
  const amount = Number(proposal.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return FORM_MESSAGES.compensationAmountPositive;
  }
  if (!/^\d+(\.\d{1,2})?$/.test(proposal.amount.toString())) {
    return FORM_MESSAGES.compensationAmountPrecision;
  }
  if (amount > COMPENSATION_AMOUNT_MAX) {
    return FORM_MESSAGES.compensationAmountLimit;
  }
  return '';
};
