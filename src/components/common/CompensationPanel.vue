<template>
  <div v-if="view" class="compensation-panel" :class="{ 'compensation-panel--compact': compact }">
    <div class="compensation-panel__head">
      <span class="compensation-panel__title">补差额</span>
      <span class="status-pill" :class="statusToneClass(view.status)">
        {{ formatCompensationStatus(view.status, view.role) }}
      </span>
    </div>
    <div class="compensation-panel__amount">
      约定 {{ formatMoney(view.amount) }}
      <small>由 {{ payerName || (view.role === 'payer' ? '我方' : '对方') }} 支付</small>
    </div>
    <dl class="compensation-panel__rows">
      <div v-if="view.pendingAmount">
        <dt>{{ pendingLabel }}</dt>
        <dd class="is-wait">{{ formatMoney(view.pendingAmount) }}</dd>
      </div>
      <div v-if="view.paidTotal">
        <dt>{{ paidLabel }}</dt>
        <dd>{{ formatMoney(view.paidTotal) }}</dd>
      </div>
      <div v-if="view.refundingAmount">
        <dt>{{ refundingLabel }}</dt>
        <dd class="is-refund">{{ formatMoney(view.refundingAmount) }}</dd>
      </div>
      <div v-if="view.refundTotal">
        <dt>{{ refundedLabel }}</dt>
        <dd>{{ formatMoney(view.refundTotal) }}</dd>
      </div>
    </dl>
    <p v-if="hint" class="compensation-panel__hint">{{ hint }}</p>
  </div>
  <div v-else-if="showNone" class="compensation-panel compensation-panel--none">
    <span>无需补款</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { Compensation } from '@/models/compensation';
import type { Exchange } from '@/models/exchange';
import { getCompensationView, type CompensationView } from '@/utils/compensation';
import {
  formatCompensationMessage,
  formatCompensationStatus,
  formatMoney,
  statusToneClass,
} from '@/utils/formatters';

const props = withDefaults(
  defineProps<{
    exchange: Exchange;
    compensation: Compensation | null;
    currentUserId?: string;
    payerName?: string;
    compact?: boolean;
    showNone?: boolean;
  }>(),
  {
    currentUserId: '',
    payerName: '',
    compact: false,
    showNone: false,
  },
);

const view = computed<CompensationView | null>(() =>
  getCompensationView(props.exchange, props.compensation, props.currentUserId),
);

const pendingLabel = computed(() => (view.value?.role === 'payee' ? '待收金额' : '待付金额'));
const paidLabel = computed(() => (view.value?.role === 'payee' ? '已收金额' : '已付金额'));
const refundingLabel = computed(() => (view.value?.role === 'payee' ? '待退还金额' : '待退回金额'));
const refundedLabel = computed(() => (view.value?.role === 'payee' ? '已退还金额' : '已退回金额'));
const hint = computed(() => (view.value && !props.compact ? formatCompensationMessage(view.value.status) : ''));
</script>
