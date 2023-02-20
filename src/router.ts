import { createRouter, createWebHistory } from 'vue-router'
import type { RouteParams, RouteRecordRaw } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import PlayPage from '@/pages/PlayPage.vue'

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
]
export const router = createRouter({
  history: createWebHistory(),
  routes,
})

export function routerPush (name: AppRouteNames, params?: RouteParams): ReturnType<typeof router.push> {
  return params === undefined ? router.push({ name }) : router.push({ name, params })
}
