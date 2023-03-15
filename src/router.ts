import { createRouter, createWebHistory } from 'vue-router'
import type { RouteParams, RouteRecordRaw } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
// https://github.com/mutoe/vue3-realworld-example-app/blob/master/src/router.ts

export type AppRouteNames =
  | 'home'
  | 'play'
  | 'edit-variant'
  | 'edit-piece'
  | 'analysis'
  | 'privacy'
  | 'cookies'

export const routes: RouteRecordRaw[] = [
  {
    name: 'home',
    path: '/',
    component: HomePage,
  },
  {
    name: 'play',
    path: '/play/:variantId?',
    component: () => import('@/pages/PlayPage.vue'),
  },
  {
    name: 'variant-details',
    path: '/variant/:variantId',
    component: () => import('@/pages/VariantDetailsPage.vue'),
  },
  {
    name: 'edit-variant',
    path: '/edit',
    component: () => import('@/pages/EditVariantPage.vue'),
  },
  {
    name: 'edit-piece',
    path: '/edit/pieces/:pieceIndex',
    component: () => import('@/pages/EditPiecePage.vue'),
  },
  {
    name: 'analysis',
    path: '/analysis',
    component: () => import('@/pages/AnalysisPage.vue'),
  },
  {
    name: 'privacy',
    path: '/privacy',
    component: () => import('@/pages/legal/PrivacyPolicyPage.vue'),
  },
  {
    name: 'cookies',
    path: '/cookies',
    component: () => import('@/pages/legal/CookiePolicyPage.vue'),
  },
  {
    name: 'tos',
    path: '/tos',
    component: () => import('@/pages/legal/TermsOfServicePage.vue'),
  },
]
export const router = createRouter({
  history: createWebHistory(),
  routes,
})

export function routerPush (name: AppRouteNames, params?: RouteParams): ReturnType<typeof router.push> {
  return params === undefined ? router.push({ name }) : router.push({ name, params })
}
