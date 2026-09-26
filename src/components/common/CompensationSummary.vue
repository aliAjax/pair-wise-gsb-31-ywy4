<template>
  <div class="comp-summary" :class="{ 'comp-summary--plain': plain }">
    <template v-if="summary.required">
      <span class="comp-chip comp-chip--amount">应补 {{ formatMoney(exchange.compensation_amount) }}</span>
      <span v-if="payer" class="comp-chip">付款方：{{ payer.nickname }}</span>
      <span v-if="summary.pending > 0" class="comp-chip comp-chip--pending">待付 {{ formatMoney(summary.pending) }}</span>
      <span v-if="summary.paid > 0" class="comp-chip comp-chip--paid">已付 {{ formatMoney(summary.paid) }}</span>
      <span v-if="summary.refundable > 0" class="comp-chip comp-chip--refund">
        待退回 {{ formatMoney(summary.refundable) }}
      </span>
      <span v-if="summary.refunded > 0" class="comp-chip">已退回 {{ formatMoney(summary.refunded) }}</span>
    </template>
    <span v-else-if="!plain" class="comp-chip comp-chip--none">无需补款</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { Exchange } from '@/models/exchange';
import type { User } from '@/models/user';
import { summarizeCompensation } from '@/utils/compensation';
import { formatMoney } from '@/utils/formatters';

const props = defineProps<{
  exchange: Exchange;
  users: User[];
  /** 简洁模式：无需补款时不渲染任何内容（个人页汇总以外使用） */
  plain?: boolean;
}>();

const summary = computed(() => summarizeCompensation(props.exchange));
const payer = computed(() =>
  props.exchange.compensation_payer_id
    ? props.users.find((user) => user.id === props.exchange.compensation_payer_id)
    : undefined,
);
</script>
