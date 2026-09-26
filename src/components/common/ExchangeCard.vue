<template>
  <article class="exchange-card">
    <header>
      <span class="status-pill" :class="statusToneClass(exchange.status)">
        {{ formatExchangeStatus(exchange.status) }}
      </span>
      <small>{{ formatDate(exchange.updated_at) }}</small>
    </header>
    <div class="exchange-card__items">
      <div>
        <span>拿出</span>
        <strong>{{ fromItem?.title ?? '未知物品' }}</strong>
      </div>
      <div>
        <span>换取</span>
        <strong>{{ toItem?.title ?? '未知物品' }}</strong>
      </div>
    </div>
    <CompensationSummary :exchange="exchange" :users="users" />
    <p>{{ exchange.message || formatStatusMessage(exchange.status) }}</p>
    <footer>
      <RouterLink class="text-link exchange-card__detail" :to="`/exchanges/${exchange.id}`">查看详情</RouterLink>
      <div v-if="canOperate" class="exchange-card__actions">
        <button v-if="exchange.status === ExchangeStatus.PENDING && isReceiver" type="button" @click="$emit('accept', exchange.id)">
          同意
        </button>
        <button v-if="exchange.status === ExchangeStatus.PENDING && isReceiver" type="button" @click="$emit('reject', exchange.id)">
          拒绝
        </button>
        <button
          v-if="exchange.status === ExchangeStatus.PENDING && isInitiator"
          type="button"
          @click="$emit('cancel', exchange.id)"
        >
          取消
        </button>
        <button
          v-if="exchange.status === ExchangeStatus.PAYING && !isPayer && summary.pending > 0"
          type="button"
          @click="$emit('register-payment', exchange.id)"
        >
          登记到账
        </button>
        <button
          v-if="exchange.status === ExchangeStatus.PAYING || exchange.status === ExchangeStatus.ACCEPTED"
          type="button"
          @click="$emit('cancel', exchange.id)"
        >
          取消交换
        </button>
        <button v-if="exchange.status === ExchangeStatus.ACCEPTED" type="button" @click="$emit('complete', exchange.id)">
          完成
        </button>
        <button
          v-if="isTerminalWithRefund"
          type="button"
          @click="$emit('register-refund', exchange.id)"
        >
          登记退回
        </button>
      </div>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import CompensationSummary from '@/components/common/CompensationSummary.vue';
import { ExchangeStatus } from '@/constants/exchange';
import type { Exchange } from '@/models/exchange';
import type { Item } from '@/models/item';
import type { User } from '@/models/user';
import { useAuthStore } from '@/stores/authStore';
import { isCompensationPayer, summarizeCompensation } from '@/utils/compensation';
import { formatDate, formatExchangeStatus, formatStatusMessage, statusToneClass } from '@/utils/formatters';

const props = defineProps<{
  exchange: Exchange;
  items: Item[];
  users: User[];
}>();

defineEmits<{
  (e: 'accept', id: string): void;
  (e: 'reject', id: string): void;
  (e: 'cancel', id: string): void;
  (e: 'complete', id: string): void;
  (e: 'register-payment', id: string): void;
  (e: 'register-refund', id: string): void;
}>();

const authStore = useAuthStore();
const fromItem = computed(() => props.items.find((item) => item.id === props.exchange.from_item_id));
const toItem = computed(() => props.items.find((item) => item.id === props.exchange.to_item_id));
const summary = computed(() => summarizeCompensation(props.exchange));
const isInitiator = computed(() => authStore.currentUser?.id === props.exchange.from_user_id);
const isReceiver = computed(() => authStore.currentUser?.id === props.exchange.to_user_id);
const isPayer = computed(() => isCompensationPayer(props.exchange, authStore.currentUser?.id));
const isTerminalWithRefund = computed(
  () =>
    [ExchangeStatus.CANCELLED, ExchangeStatus.REJECTED].includes(props.exchange.status) &&
    summary.value.refundable > 0,
);
const canOperate = computed(
  () =>
    isReceiver.value ||
    (isInitiator.value &&
      [ExchangeStatus.PENDING, ExchangeStatus.ACCEPTED, ExchangeStatus.PAYING].includes(props.exchange.status)) ||
    isTerminalWithRefund.value,
);
</script>
