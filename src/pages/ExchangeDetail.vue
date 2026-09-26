<template>
  <section v-if="exchange" class="page exchange-detail-page">
    <RouterLink class="text-link" to="/exchanges">返回交换列表</RouterLink>

    <div class="page-heading">
      <div>
        <p class="eyebrow">交换详情</p>
        <h1>{{ formatExchangeStatus(exchange.status) }}</h1>
      </div>
      <span class="status-pill" :class="statusToneClass(exchange.status)">
        {{ formatExchangeStatus(exchange.status) }}
      </span>
    </div>

    <article class="exchange-card exchange-detail-card">
      <header>
        <small>发起于 {{ formatDate(exchange.created_at) }}</small>
        <small>更新于 {{ formatDate(exchange.updated_at) }}</small>
      </header>
      <div class="exchange-card__items">
        <div>
          <span>{{ fromUser?.nickname ?? '发起方' }} 拿出</span>
          <strong>{{ fromItem?.title ?? '未知物品' }}</strong>
        </div>
        <div>
          <span>换取 {{ toUser?.nickname ?? '物主' }} 的</span>
          <strong>{{ toItem?.title ?? '未知物品' }}</strong>
        </div>
      </div>
      <p>{{ exchange.message || formatStatusMessage(exchange.status) }}</p>
    </article>

    <article class="exchange-card">
      <h2 class="detail-section-title">补差额</h2>
      <template v-if="summary.required">
        <div class="comp-detail-grid">
          <div>
            <dt>约定补款</dt>
            <dd>{{ formatMoney(exchange.compensation_amount) }}</dd>
          </div>
          <div>
            <dt>付款方</dt>
            <dd>{{ payer?.nickname ?? '未知用户' }}</dd>
          </div>
          <div>
            <dt>待付</dt>
            <dd>{{ formatMoney(summary.pending) }}</dd>
          </div>
          <div>
            <dt>已付（到账）</dt>
            <dd>{{ formatMoney(summary.paid) }}</dd>
          </div>
          <div>
            <dt>待退回</dt>
            <dd :class="{ 'comp-refund-text': summary.refundable > 0 }">{{ formatMoney(summary.refundable) }}</dd>
          </div>
          <div>
            <dt>已退回</dt>
            <dd>{{ formatMoney(summary.refunded) }}</dd>
          </div>
        </div>
        <p v-if="exchange.compensation_paid_at" class="form-note">到账登记时间：{{ formatDate(exchange.compensation_paid_at) }}</p>
        <p v-if="exchange.compensation_refunded_at" class="form-note">
          退回登记时间：{{ formatDate(exchange.compensation_refunded_at) }}
        </p>
        <p class="comp-flow-note">{{ formatStatusMessage(exchange.status) }}</p>
      </template>
      <p v-else class="form-note">{{ PAGE_MESSAGES.compensationNone }}</p>
    </article>

    <div class="exchange-detail-actions">
      <button
        v-if="exchange.status === ExchangeStatus.PENDING && isReceiver"
        class="primary-button"
        type="button"
        @click="exchangeStore.accept(exchange.id)"
      >
        同意交换
      </button>
      <button
        v-if="exchange.status === ExchangeStatus.PENDING && isReceiver"
        class="secondary-button"
        type="button"
        @click="exchangeStore.reject(exchange.id)"
      >
        拒绝
      </button>
      <button
        v-if="exchange.status === ExchangeStatus.PENDING && isInitiator"
        class="secondary-button"
        type="button"
        @click="exchangeStore.cancel(exchange.id)"
      >
        取消请求
      </button>
      <button
        v-if="exchange.status === ExchangeStatus.PAYING && !isPayer && summary.pending > 0"
        class="primary-button"
        type="button"
        @click="exchangeStore.registerPayment(exchange.id)"
      >
        确认补款已到账（一次性登记）
      </button>
      <p v-if="exchange.status === ExchangeStatus.PAYING && isPayer" class="form-note">
        请按约定向收款方支付 {{ formatMoney(summary.pending) }}，到账后由对方登记，登记成功交换才会进入进行中。
      </p>
      <button
        v-if="exchange.status === ExchangeStatus.PAYING || exchange.status === ExchangeStatus.ACCEPTED"
        class="secondary-button"
        type="button"
        @click="exchangeStore.cancel(exchange.id)"
      >
        取消交换
      </button>
      <button
        v-if="exchange.status === ExchangeStatus.ACCEPTED"
        class="primary-button"
        type="button"
        @click="completeExchange"
      >
        确认交换完成
      </button>
      <button
        v-if="isTerminalWithRefund"
        class="secondary-button"
        type="button"
        @click="exchangeStore.registerRefund(exchange.id)"
      >
        线下已退款，登记退回 {{ formatMoney(summary.refundable) }}
      </button>
    </div>
  </section>
  <EmptyState v-else title="交换请求不存在" :description="PAGE_MESSAGES.exchangeDetailNotFound" mark="404" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

import EmptyState from '@/components/common/EmptyState.vue';
import { ExchangeStatus } from '@/constants/exchange';
import { PAGE_MESSAGES } from '@/constants/messages';
import { useAuthStore } from '@/stores/authStore';
import { useExchangeStore } from '@/stores/exchangeStore';
import { useItemStore } from '@/stores/itemStore';
import { isCompensationPayer, summarizeCompensation } from '@/utils/compensation';
import {
  formatDate,
  formatExchangeStatus,
  formatMoney,
  formatStatusMessage,
  statusToneClass,
} from '@/utils/formatters';

const route = useRoute();
const authStore = useAuthStore();
const itemStore = useItemStore();
const exchangeStore = useExchangeStore();

const exchange = computed(() => exchangeStore.exchanges.find((entry) => entry.id === route.params.id));
const fromItem = computed(() => itemStore.items.find((item) => item.id === exchange.value?.from_item_id));
const toItem = computed(() => itemStore.items.find((item) => item.id === exchange.value?.to_item_id));
const fromUser = computed(() => authStore.users.find((user) => user.id === exchange.value?.from_user_id));
const toUser = computed(() => authStore.users.find((user) => user.id === exchange.value?.to_user_id));
const payer = computed(() =>
  exchange.value?.compensation_payer_id
    ? authStore.users.find((user) => user.id === exchange.value?.compensation_payer_id)
    : undefined,
);
const EMPTY_SUMMARY = { required: false, pending: 0, paid: 0, refundable: 0, refunded: 0 } as const;
const summary = computed(() => (exchange.value ? summarizeCompensation(exchange.value) : EMPTY_SUMMARY));

const isInitiator = computed(() => authStore.currentUser?.id === exchange.value?.from_user_id);
const isReceiver = computed(() => authStore.currentUser?.id === exchange.value?.to_user_id);
const isPayer = computed(() => (exchange.value ? isCompensationPayer(exchange.value, authStore.currentUser?.id) : false));
const isTerminalWithRefund = computed(
  () =>
    Boolean(exchange.value) &&
    [ExchangeStatus.CANCELLED, ExchangeStatus.REJECTED].includes(exchange.value!.status) &&
    Boolean(summary.value?.refundable),
);

const completeExchange = async () => {
  if (!exchange.value) return;
  await exchangeStore.complete(exchange.value.id);
  itemStore.items = itemStore.items.map((item) => item);
};
</script>
