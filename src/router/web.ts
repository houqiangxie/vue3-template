import { createRouter, createWebHistory } from 'vue-router'

import permission from './permission'

const viewModules = import.meta.glob('/src/views/web/**/*.vue')

const routerBase = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/`

const router = createRouter({
  history: createWebHistory(routerBase),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
    },
    {
      path: '/403',
      name: 'Error403',
      component: () => import('@/views/error-page/403.vue'),
    },
    {
      path: '/404',
      name: 'Error404',
      component: () => import('@/views/error-page/404.vue'),
    },
    {
      path: '/500',
      name: 'Error500',
      component: () => import('@/views/error-page/500.vue'),
    },
    {
      path: '/',
      name: 'Layout',
      component: () => import('@/layout/index.vue'),
      children: [],
    },
  ],
})

permission(router, viewModules, '/src/views/web/')

export default router
