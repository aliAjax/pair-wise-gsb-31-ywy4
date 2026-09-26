<template>
  <section v-if="item" class="page detail-page">
    <RouterLink class="text-link" to="/home">返回首页</RouterLink>
    <div class="detail-layout">
      <ItemImageGallery :images="item.images" :fallback-text="item.category" />
      <article class="detail-panel">
        <div class="item-card__topline">
          <span class="pill">{{ item.category }}</span>
          <span class="status-pill" :class="statusToneClass(item.status)">
            {{ formatItemStatus(item.status) }}
          </span>
        </div>
        <h1>{{ item.title }}</h1>
        <p>{{ item.description }}</p>
        <dl class="detail-list">
          <div>
            <dt>成色</dt>
            <dd>{{ formatCondition(item.condition) }}</dd>
          </div>
          <div>
            <dt>地点</dt>
            <dd>{{ item.location }}</dd>
          </div>
          <div>
            <dt>发布时间</dt>
            <dd>{{ formatDate(item.created_at) }}</dd>
          </div>
        </dl>
        <UserBrief v-if="owner" :user="owner" />

        <div v-if="!isMine" class="exchange-box">
          <label>
            我的交换物
            <select v-model="selectedItemId">
              <option value="">选择一件我发布的可交换物品</option>
              <option v-for="myItem in ownAvailableItems" :key="myItem.id" :value="myItem.id">
                {{ myItem.title }}
              </option>
            </select>
          </label>
          <label class="comp-toggle">
            <input v-model="compensationEnabled" type="checkbox" />
            双方物品价值不等，约定补差价
          </label>
          <div v-if="compensationEnabled" class="comp-form">
            <label>
              付款方
              <select v-model="compensationPayerId">
                <option value="">选择由谁补款</option>
                <option :value="currentUserId">我（发起方）补差价给物主</option>
                <option v-if="owner" :value="owner.id">物主补差价给我</option>
              </select>
            </label>
            <label>
              补差金额（元）
              <input v-model="compensationAmount" inputmode="decimal" placeholder="例如 50.00" type="text" />
            </label>
            <p class="form-note">{{ PAGE_MESSAGES.compensationHint }}</p>
          </div>
          <label>
            留言
            <textarea v-model="messageText" rows="3" />
          </label>
          <button class="primary-button" type="button" :disabled="item.status !== ItemStatus.AVAILABLE" @click="requestExchange">
            发起交换
          </button>
        </div>
        <button v-else-if="item.status === ItemStatus.AVAILABLE" class="secondary-button" type="button" @click="offlineItem">
          下架这件物品
        </button>
      </article>
    </div>
  </section>
  <EmptyState v-else title="物品不存在" description="可能已被清理或链接无效" mark="404" />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

import EmptyState from '@/components/common/EmptyState.vue';
import ItemImageGallery from '@/components/common/ItemImageGallery.vue';
import UserBrief from '@/components/common/UserBrief.vue';
import { ExchangeStatus } from '@/constants/exchange';
import { ItemStatus } from '@/constants/item';
import { PAGE_MESSAGES } from '@/constants/messages';
import { useAuthStore } from '@/stores/authStore';
import { useExchangeStore } from '@/stores/exchangeStore';
import { useItemStore } from '@/stores/itemStore';
import { formatCondition, formatDate, formatItemStatus, statusToneClass } from '@/utils/formatters';
import { message } from '@/utils/message';
import { validateCompensation } from '@/utils/validators';

const route = useRoute();
const itemStore = useItemStore();
const authStore = useAuthStore();
const exchangeStore = useExchangeStore();

const item = computed(() => itemStore.items.find((entry) => entry.id === route.params.id));
const owner = computed(() => authStore.users.find((user) => user.id === item.value?.user_id));
const isMine = computed(() => authStore.currentUser?.id === item.value?.user_id);
const ownAvailableItems = computed(() =>
  authStore.currentUser ? itemStore.availableMyItems(authStore.currentUser.id) : [],
);
const selectedItemId = ref('');
const messageText = ref('我想用这件闲置与你交换，可以沟通时间和地点。');
const compensationEnabled = ref(false);
const compensationPayerId = ref('');
const compensationAmount = ref('');
const currentUserId = computed(() => authStore.currentUser?.id ?? '');

const requestExchange = async () => {
  if (!authStore.currentUser || !item.value || !owner.value) return;
  if (!itemStore.assertCanExchange(authStore.currentUser.id)) return;
  if (!selectedItemId.value) {
    message('请选择一件自己的物品', 'error');
    return;
  }
  const compensationError = validateCompensation(compensationEnabled.value, compensationAmount.value, compensationPayerId.value);
  if (compensationError) {
    message(compensationError, 'error');
    return;
  }
  await exchangeStore.create({
    from_user_id: authStore.currentUser.id,
    to_user_id: owner.value.id,
    from_item_id: selectedItemId.value,
    to_item_id: item.value.id,
    status: ExchangeStatus.PENDING,
    message: messageText.value,
    compensation_amount: compensationEnabled.value ? Number(compensationAmount.value) : 0,
    compensation_payer_id: compensationEnabled.value ? compensationPayerId.value : null,
  });
};

const offlineItem = async () => {
  if (!item.value) return;
  await itemStore.offline(item.value.id);
};
</script>
