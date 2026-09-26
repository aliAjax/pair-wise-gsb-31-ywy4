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
    <CompensationPanel
      :exchange="exchange"
      :compensation="compensation"
      :current-user-id="currentUserId"
      :payer-name="payerName"
      compact
    />
    <p>{{ exchange.message || formatStatusMessage(exchange.status) }}</p>
    <footer>
      <span v-if="fromUser && toUser">{{ fromUser.nickname }} → {{ toUser.nickname }}</span>
      <RouterLink class="exchange-card__detail" :to="`/exchange/${exchange.id}`">查看详情</RouterLink>
      <div v-if="canOperate" class="exchange-card__actions">
        <template v-if="exchange.status === ExchangeStatus.PENDING">
          <button v-if="isOwner" type="button" @click="$emit('accept', exchange.id)">同意</button>
          <button v-if="isOwner" type="button" @click="$emit('reject', exchange.id)">拒绝</button>
          <button v-else type="button" @click="$emit('cancel', exchange.id)">取消请求</button>
        </template>
        <template v-else-if="exchange.status === ExchangeStatus.AWAITING_PAYMENT">
          <button v-if="canRegisterPayment" type="button" @click="$emit('register-payment', exchange.id)">
            登记到账
          </button>
          <button type="button" @click="$emit('cancel', exchange.id)">取消交换</button>
        </template>
        <template v-else-if="exchange.status === ExchangeStatus.ACCEPTED">
          <button type="button" @click="$emit('complete', exchange.id)">完成</button>
          <button type="button" @click="$emit('cancel', exchange.id)">取消交换</button>
        </template>
        <button
          v-if="isPayee && canRegisterRefund"
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

import CompensationPanel from '@/components/common/CompensationPanel.vue';
import { CompensationPayer, CompensationStatus } from '@/constants/compensation';
import { ExchangeStatus } from '@/constants/exchange';
import type { Compensation } from '@/models/compensation';
import type { Exchange } from '@/models/exchange';
import type { Item } from '@/models/item';
import type { User } from '@/models/user';
import { useAuthStore } from '@/stores/authStore';
import { formatDate, formatExchangeStatus, formatStatusMessage, statusToneClass } from '@/utils/formatters';

const props = defineProps<{
  exchange: Exchange;
  items: Item[];
  users: User[];
  compensation: Compensation | null;
}>();

defineEmits<{
  accept: [id: string];
  reject: [id: string];
  cancel: [id: string];
  complete: [id: string];
  'register-payment': [id: string];
  'register-refund': [id: string];
}>();

const authStore = useAuthStore();
const currentUserId = computed(() => authStore.currentUser?.id ?? '');
const fromItem = computed(() => props.items.find((item) => item.id === props.exchange.from_item_id));
const toItem = computed(() => props.items.find((item) => item.id === props.exchange.to_item_id));
const fromUser = computed(() => props.users.find((user) => user.id === props.exchange.from_user_id));
const toUser = computed(() => props.users.find((user) => user.id === props.exchange.to_user_id));
const isOwner = computed(() => currentUserId.value === props.exchange.to_user_id);
const isPayee = computed(
  () => Boolean(props.compensation) && props.compensation?.payee_user_id === currentUserId.value,
);
const canRegisterPayment = computed(
  () => isPayee.value && props.compensation?.status === CompensationStatus.PENDING,
);
const canRegisterRefund = computed(() => isPayee.value && props.compensation?.status === CompensationStatus.REFUNDING);
const canOperate = computed(() => {
  const { status } = props.exchange;
  if (status === ExchangeStatus.PENDING) {
    return isOwner.value || currentUserId.value === props.exchange.from_user_id;
  }
  if (status === ExchangeStatus.AWAITING_PAYMENT || status === ExchangeStatus.ACCEPTED) {
    return (
      currentUserId.value === props.exchange.to_user_id || currentUserId.value === props.exchange.from_user_id
    );
  }
  return isPayee.value;
});

const payerName = computed(() => {
  if (!props.exchange.compensation || !authStore.currentUser) return '';
  const payerId =
    props.exchange.compensation.payer === CompensationPayer.INITIATOR
      ? props.exchange.from_user_id
      : props.exchange.to_user_id;
  return props.users.find((user) => user.id === payerId)?.nickname ?? '';
});
</script>
