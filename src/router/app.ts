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
      path: '/',
      name: 'Layout',
      component: () => import('@/layout/index.vue'),
      children: [],
    },
  ],
})

permission(router, viewModules, '/src/views/app/')

export default router
