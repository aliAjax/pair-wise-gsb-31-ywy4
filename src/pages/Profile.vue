<template>
  <section v-if="currentUser" class="page profile-page">
    <div class="page-heading">
      <div>
        <p class="eyebrow">个人中心</p>
        <h1>资料越完整，交换越容易达成</h1>
      </div>
    </div>

    <div class="profile-layout">
      <form class="profile-form" @submit.prevent="save">
        <label>
          本地模拟登录
          <select v-model="selectedUserId" @change="switchUser">
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.nickname }} · {{ user.location }}
            </option>
          </select>
        </label>
        <AvatarUploader v-model="form.avatar" />
        <label>
          昵称
          <input v-model="form.nickname" />
        </label>
        <label>
          电话
          <input v-model="form.phone" />
        </label>
        <label>
          常用地点
          <input v-model="form.location" />
        </label>
        <button class="primary-button" type="submit">保存资料</button>
      </form>

      <div class="profile-side">
        <UserBrief :user="{ ...currentUser, ...form }" />
        <div class="stats-row">
          <span>发布 {{ myItems.length }}</span>
          <span>可交换 {{ availableCount }}</span>
          <span>信用 {{ currentUser.credit_score }}</span>
        </div>
      </div>
    </div>

    <section class="comp-ledger">
      <h2>补差额账本</h2>
      <div v-if="compStats.total" class="comp-ledger__grid">
        <div class="comp-ledger__group">
          <h3>我作为付款方</h3>
          <div class="stats-row">
            <span>待付 {{ formatMoney(compStats.payerPending) }}</span>
            <span>已付 {{ formatMoney(compStats.payerPaid) }}</span>
            <span>已退回 {{ formatMoney(compStats.payerRefunded) }}</span>
          </div>
          <p v-if="compStats.payerRefundable > 0" class="form-note comp-refund-text">
            还有 {{ formatMoney(compStats.payerRefundable) }} 已付款等待对方退回
          </p>
        </div>
        <div class="comp-ledger__group">
          <h3>我作为收款方</h3>
          <div class="stats-row">
            <span>待收 {{ formatMoney(compStats.payeePending) }}</span>
            <span>已收 {{ formatMoney(compStats.payeeReceived) }}</span>
            <span>已退回 {{ formatMoney(compStats.payeeRefunded) }}</span>
          </div>
          <p v-if="compStats.payeeRefundable > 0" class="form-note comp-refund-text">
            有 {{ formatMoney(compStats.payeeRefundable) }} 已到账补款需要线下退回并登记
          </p>
        </div>
      </div>
      <EmptyState v-else title="暂无补差记录" :description="PAGE_MESSAGES.compensationNone" mark="¥" />
    </section>

    <section class="my-items">
      <h2>我发布的物品</h2>
      <div v-if="myItems.length" class="waterfall waterfall--compact">
        <ItemCard
          v-for="item in myItems"
          :key="item.id"
          :item="item"
          :owner="currentUser"
        />
      </div>
      <EmptyState v-else title="还没有发布物品" description="发布一件闲置后会出现在这里" mark="物" />
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, watchEffect } from 'vue';

import AvatarUploader from '@/components/common/AvatarUploader.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import ItemCard from '@/components/common/ItemCard.vue';
import UserBrief from '@/components/common/UserBrief.vue';
import { ItemStatus } from '@/constants/item';
import { PAGE_MESSAGES } from '@/constants/messages';
import { useAuth } from '@/hooks/useAuth';
import { useCompensationStats } from '@/hooks/useCompensationStats';
import { useExchangeStore } from '@/stores/exchangeStore';
import { useItemStore } from '@/stores/itemStore';
import { formatMoney } from '@/utils/formatters';

const { currentUser, users, login, updateProfile } = useAuth();
const itemStore = useItemStore();
const exchangeStore = useExchangeStore();
const selectedUserId = ref('');

const form = reactive({
  nickname: '',
  avatar: '',
  phone: '',
  location: '',
});

watchEffect(() => {
  if (currentUser.value) {
    selectedUserId.value = currentUser.value.id;
    form.nickname = currentUser.value.nickname;
    form.avatar = currentUser.value.avatar;
    form.phone = currentUser.value.phone;
    form.location = currentUser.value.location;
  }
});

watch(
  () => users.value.length,
  () => {
    if (!selectedUserId.value && currentUser.value) {
      selectedUserId.value = currentUser.value.id;
    }
  },
);

const myItems = computed(() => (currentUser.value ? itemStore.myItems(currentUser.value.id) : []));
const availableCount = computed(() => myItems.value.filter((item) => item.status === ItemStatus.AVAILABLE).length);
const compStats = useCompensationStats(
  () => exchangeStore.exchanges,
  () => currentUser.value?.id,
);

const save = async () => {
  await updateProfile({ ...form });
};

const switchUser = async () => {
  if (selectedUserId.value) {
    await login(selectedUserId.value);
  }
};
</script>
