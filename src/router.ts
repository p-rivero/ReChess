import { createRouter, createWebHistory } from 'vue-router'
import type { RouteParams, RouteRecordRaw } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import PlayPage from '@/pages/PlayPage.vue'
import EditVariantPage from '@/pages/EditVariantPage.vue'
import EditPiecePage from '@/pages/EditPiecePage.vue'
import AnalysisPage from './pages/AnalysisPage.vue'

// https://github.com/mutoe/vue3-realworld-example-app/blob/master/src/router.ts

export type AppRouteNames =
  | 'home'
  | 'play'

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
]
export const router = createRouter({
  history: createWebHistory(),
  routes,
})

export function routerPush (name: AppRouteNames, params?: RouteParams): ReturnType<typeof router.push> {
  return params === undefined ? router.push({ name }) : router.push({ name, params })
}
