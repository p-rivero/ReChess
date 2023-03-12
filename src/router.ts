import { createRouter, createWebHistory } from 'vue-router'
import type { RouteParams, RouteRecordRaw } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import PlayPage from '@/pages/PlayPage.vue'
import EditVariantPage from '@/pages/EditVariantPage.vue'
import EditPiecePage from '@/pages/EditPiecePage.vue'
import AnalysisPage from '@/pages/AnalysisPage.vue'
import PrivacyPolicyPage from '@/pages/legal/PrivacyPolicyPage.vue'
import CookiePolicyPage from '@/pages/legal/CookiePolicyPage.vue'
import TermsOfServicePage from '@/pages/legal/TermsOfServicePage.vue'

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
    path: '/play',
    component: PlayPage,
  },
  {
    name: 'edit-variant',
    path: '/edit',
    component: EditVariantPage,
  },
  {
    name: 'edit-piece',
    path: '/edit/pieces/:pieceIndex',
    component: EditPiecePage,
  },
  {
    name: 'analysis',
    path: '/analysis',
    component: AnalysisPage,
  },
  {
    name: 'privacy',
    path: '/privacy',
    component: PrivacyPolicyPage,
  },
  {
    name: 'cookies',
    path: '/cookies',
    component: CookiePolicyPage,
  },
  {
    name: 'tos',
    path: '/tos',
    component: TermsOfServicePage,
  },
]
export const router = createRouter({
  history: createWebHistory(),
  routes,
})

export function routerPush (name: AppRouteNames, params?: RouteParams): ReturnType<typeof router.push> {
  return params === undefined ? router.push({ name }) : router.push({ name, params })
}
