import { createRouter, createWebHistory } from 'vue-router'
import type { RouteParams, RouteRecordRaw } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import { updateTitle } from '@/utils/web-utils'
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
    component: () => import('@/pages/Variant/VariantDetailsPage.vue'),
  },
  {
    name: 'edit-variant',
    path: '/edit',
    component: () => import('@/pages/Variant/EditVariantPage.vue'),
    meta: { title: 'Edit Draft' },
  },
  {
    name: 'edit-piece',
    path: '/edit/pieces/:pieceIndex',
    component: () => import('@/pages/Variant/EditPiecePage.vue'),
    meta: { title: 'Edit Draft' },
  },
  {
    name: 'analysis',
    path: '/analysis/:variantId?',
    component: () => import('@/pages/AnalysisPage.vue'),
    meta: { title: 'Analysis Board' },
  },
  {
    name: 'user-profile',
    path: '/user/:username',
    component: () => import('@/pages/UserProfilePage.vue'),
  },
  {
    name: 'privacy',
    path: '/privacy',
    component: () => import('@/pages/Legal/PrivacyPolicyPage.vue'),
    meta: { title: 'Privacy Policy' },
  },
  {
    name: 'cookies',
    path: '/cookies',
    component: () => import('@/pages/Legal/CookiePolicyPage.vue'),
    meta: { title: 'Cookie Policy' },
  },
  {
    name: 'tos',
    path: '/tos',
    component: () => import('@/pages/Legal/TermsOfServicePage.vue'),
    meta: { title: 'Terms of Service' },
  },
]
export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const toTitle = to.meta.title as string | undefined
  updateTitle(toTitle)
  next()
})

export function routerPush (name: AppRouteNames, params?: RouteParams): ReturnType<typeof router.push> {
  return params === undefined ? router.push({ name }) : router.push({ name, params })
}
