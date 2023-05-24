import { createRouter, createWebHistory } from 'vue-router'
import { updateTitle } from '@/helpers/web-utils'
import HomePage from '@/pages/HomePage.vue'
import type { RouteParams, RouteRecordRaw } from 'vue-router'
// https://github.com/mutoe/vue3-realworld-example-app/blob/master/src/router.ts

export type AppRouteNames =
  | 'home'
  | 'variant-details'
  | 'variant-lobby'
  | 'variant-analysis'
  | 'play-offline'
  | 'play-online'
  | 'edit-draft'
  | 'edit-piece'
  | 'draft-play'
  | 'draft-analysis'
  | 'user-profile'
  | 'user-published-variants'
  | 'user-upvoted-variants'
  | 'moderator-dashboard'
  | 'privacy'
  | 'cookies'
  | 'tos'

export const routes: RouteRecordRaw[] = [
  
  {
    name: 'home',
    path: '/',
    component: HomePage,
  },
  
  
  {
    name: 'variant-details',
    path: '/variant/:variantId',
    component: () => import('@/pages/Variant/VariantDetailsPage.vue'),
  },
  {
    name: 'variant-lobby',
    path: '/variant/:variantId/lobby',
    component: () => import('@/pages/Game/LobbyPage.vue'),
  },
  {
    name: 'variant-analysis',
    path: '/variant/:variantId/analysis',
    component: () => import('@/pages/Game/AnalysisPage.vue'),
    meta: { title: 'Analysis Board' },
  },
  {
    name: 'play-offline',
    path: '/variant/:variantId/play',
    component: () => import('@/pages/Game/LocalPlayPage.vue'),
  },
  {
    name: 'play-online',
    path: '/game/:gameId',
    component: () => import('@/pages/Game/OnlinePlayPage.vue'),
  },
  
  
  {
    name: 'edit-draft',
    path: '/draft',
    component: () => import('@/pages/Variant/EditVariantPage.vue'),
    meta: { title: 'Edit Draft' },
  },
  {
    name: 'edit-piece',
    path: '/draft/pieces/:pieceIndex',
    component: () => import('@/pages/Variant/EditPiecePage.vue'),
    meta: { title: 'Edit Piece' },
  },
  {
    name: 'draft-play',
    path: '/draft/play',
    component: () => import('@/pages/Game/LocalPlayPage.vue'),
  },
  {
    name: 'draft-analysis',
    path: '/draft/analysis',
    component: () => import('@/pages/Game/AnalysisPage.vue'),
    meta: { title: 'Analysis Board' },
  },
  
  
  {
    name: 'user-profile',
    path: '/user/:username',
    component: () => import('@/pages/User/UserProfilePage.vue'),
  },
  {
    name: 'user-published-variants',
    path: '/user/:username/variants',
    component: () => import('@/pages/User/UserPublishedVariantsPage.vue'),
  },
  {
    name: 'user-upvoted-variants',
    path: '/user/:username/upvoted',
    component: () => import('@/pages/User/UserUpvotedVariantsPage.vue'),
  },
  
  {
    name: 'moderator-dashboard',
    path: '/moderate',
    component: () => import('@/pages/Moderator/ModeratorDashboardPage.vue'),
    meta: { title: 'Moderator Dashboard' },
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
  
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/pages/NotFoundPage.vue'),
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
