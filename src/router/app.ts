import { createRouter, createWebHistory } from 'vue-router'
import permission from './permission'

const viewModules = import.meta.glob('/src/views/app/**/*.vue')

const routerBase = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/app/`

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
      // H5 预留壳，不复用 web 后台 layout（侧栏 / 多页签 / 项目配置等）
      component: () => import('@/layout/AppLayout.vue'),
      children: [],
    },
  ],
})

permission(router, viewModules, '/src/views/app/')

export default router
