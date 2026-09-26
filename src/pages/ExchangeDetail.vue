<template>
  <section v-if="exchange" class="page exchange-detail-page">
    <RouterLink class="text-link" to="/exchanges">返回交换列表</RouterLink>

    <div class="page-heading">
      <div>
        <p class="eyebrow">交换详情</p>
        <h1>{{ formatExchangeStatus(exchange.status) }}</h1>
      </div>
      <span class="status-pill" :class="statusToneClass(exchange.status)">
        {{ formatStatusMessage(exchange.status) }}
      </span>
    </div>

    <div class="exchange-detail-grid">
      <article class="exchange-detail-panel">
        <h2>交换物品</h2>
        <div class="exchange-card__items">
          <div>
            <span>{{ fromUser?.nickname ?? '发起方' }} 拿出</span>
            <strong>{{ fromItem?.title ?? '未知物品' }}</strong>
            <small v-if="fromItem">{{ fromItem.category }} · {{ formatCondition(fromItem.condition) }}</small>
          </div>
          <div>
            <span>{{ toUser?.nickname ?? '物主' }} 换取</span>
            <strong>{{ toItem?.title ?? '未知物品' }}</strong>
            <small v-if="toItem">{{ toItem.category }} · {{ formatCondition(toItem.condition) }}</small>
          </div>
        </div>
        <p class="exchange-detail-message">{{ exchange.message || '这次交换没有留言。' }}</p>
        <dl class="detail-list detail-list--time">
          <div>
            <dt>发起时间</dt>
            <dd>{{ formatDate(exchange.created_at) }}</dd>
          </div>
          <div>
            <dt>最近更新</dt>
            <dd>{{ formatDate(exchange.updated_at) }}</dd>
          </div>
        </dl>
      </article>

      <aside class="exchange-detail-panel exchange-detail-side">
        <h2>补差额</h2>
        <CompensationPanel
          :exchange="exchange"
          :compensation="compensation"
          :current-user-id="currentUserId"
          :payer-name="payerName"
        />
        <UserBrief v-if="fromUser" :user="fromUser" />
        <UserBrief v-if="toUser" :user="toUser" />
      </aside>
    </div>

    <div v-if="canOperate" class="exchange-detail-actions">
      <template v-if="exchange.status === ExchangeStatus.PENDING">
        <button v-if="isOwner" class="primary-button" type="button" @click="exchangeStore.accept(exchange.id)">
          同意交换
        </button>
        <button v-if="isOwner" class="secondary-button" type="button" @click="exchangeStore.reject(exchange.id)">
          拒绝
        </button>
        <button v-if="!isOwner" class="secondary-button" type="button" @click="exchangeStore.cancel(exchange.id)">
          取消请求
        </button>
      </template>
      <template v-else-if="exchange.status === ExchangeStatus.AWAITING_PAYMENT">
        <button v-if="canRegisterPayment" class="primary-button" type="button" @click="exchangeStore.registerPayment(exchange.id)">
          确认到账并登记
        </button>
        <button class="secondary-button" type="button" @click="exchangeStore.cancel(exchange.id)">
          取消交换
        </button>
      </template>
      <template v-else-if="exchange.status === ExchangeStatus.ACCEPTED">
        <button class="primary-button" type="button" @click="complete">确认交换完成</button>
        <button class="secondary-button" type="button" @click="exchangeStore.cancel(exchange.id)">
          取消交换
        </button>
      </template>
      <button
        v-if="canRegisterRefund"
        class="secondary-button"
        type="button"
        @click="exchangeStore.registerRefund(exchange.id)"
      >
        登记线下退回
      </button>
    </div>
  </section>
  <EmptyState v-else title="交换不存在" :description="PAGE_MESSAGES.exchangeNotFound" mark="404" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

import CompensationPanel from '@/components/common/CompensationPanel.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import UserBrief from '@/components/common/UserBrief.vue';
import { CompensationPayer, CompensationStatus } from '@/constants/compensation';
import { ExchangeStatus } from '@/constants/exchange';
import { PAGE_MESSAGES } from '@/constants/messages';
import { useAuthStore } from '@/stores/authStore';
import { useExchangeStore } from '@/stores/exchangeStore';
import { useItemStore } from '@/stores/itemStore';
import {
  formatCondition,
  formatDate,
  formatExchangeStatus,
  formatStatusMessage,
  statusToneClass,
} from '@/utils/formatters';

const route = useRoute();
const authStore = useAuthStore();
const itemStore = useItemStore();
const exchangeStore = useExchangeStore();

const exchange = computed(() => exchangeStore.exchanges.find((item) => item.id === route.params.id));
const compensation = computed(() => (exchange.value ? exchangeStore.compensationOf(exchange.value.id) : null));
const currentUserId = computed(() => authStore.currentUser?.id ?? '');

const fromItem = computed(() =>
  exchange.value ? itemStore.items.find((item) => item.id === exchange.value?.from_item_id) : undefined,
);
const toItem = computed(() =>
  exchange.value ? itemStore.items.find((item) => item.id === exchange.value?.to_item_id) : undefined,
);
const fromUser = computed(() =>
  exchange.value ? authStore.users.find((user) => user.id === exchange.value?.from_user_id) : undefined,
);
const toUser = computed(() =>
  exchange.value ? authStore.users.find((user) => user.id === exchange.value?.to_user_id) : undefined,
);

const isOwner = computed(() => Boolean(exchange.value && currentUserId.value === exchange.value.to_user_id));
const isPayee = computed(
  () => Boolean(compensation.value) && compensation.value?.payee_user_id === currentUserId.value,
);
const canRegisterPayment = computed(
  () => isPayee.value && compensation.value?.status === CompensationStatus.PENDING,
);
const canOperate = computed(() => {
  if (!exchange.value) return false;
  const inFlow = [ExchangeStatus.PENDING, ExchangeStatus.AWAITING_PAYMENT, ExchangeStatus.ACCEPTED].includes(
    exchange.value.status,
  );
  return inFlow || canRegisterRefund.value;
});
const canRegisterRefund = computed(
  () => isPayee.value && compensation.value?.status === CompensationStatus.REFUNDING,
);

const payerName = computed(() => {
  if (!exchange.value?.compensation) return '';
  const payerId =
    exchange.value.compensation.payer === CompensationPayer.INITIATOR
      ? exchange.value.from_user_id
      : exchange.value.to_user_id;
  return authStore.users.find((user) => user.id === payerId)?.nickname ?? '';
});

const complete = async () => {
  if (!exchange.value) return;
  await exchangeStore.complete(exchange.value.id);
  itemStore.items = itemStore.items.map((item) => item);
};
</script>
