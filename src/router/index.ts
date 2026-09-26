import { createRouter, createWebHistory } from 'vue-router';

import { setupRouterGuards } from './guards';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/home', name: 'home', component: () => import('@/pages/Home.vue') },
    { path: '/item/:id', name: 'item-detail', component: () => import('@/pages/ItemDetail.vue') },
    { path: '/publish', name: 'publish', component: () => import('@/pages/Publish.vue') },
    { path: '/exchanges', name: 'exchanges', component: () => import('@/pages/Exchanges.vue') },
    { path: '/exchange/:id', name: 'exchange-detail', component: () => import('@/pages/ExchangeDetail.vue') },
    { path: '/profile', name: 'profile', component: () => import('@/pages/Profile.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/home' },
  ],
});

setupRouterGuards(router);

export default router;
