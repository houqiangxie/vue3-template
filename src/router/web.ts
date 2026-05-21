import { createRouter, createWebHistory } from 'vue-router'
import permission from './permission'
import { generateFileRoutes } from './utils/generateFileRoutes'
import { flattenRoutesToPool } from './utils/routeFilter'

// NOTE: import.meta.glob argument must be a string literal.
const webModules = import.meta.glob('/src/views/web/**/*.vue')

export const allWebRoutes = generateFileRoutes(webModules, '/src/views/web/', {
  defaultMeta: { requiresAuth: true },
  routeConfig: {
    // Root layout redirects to first child
    'Index': { redirect: { name: 'Index-Home' } },
    // Home sub-layout: show title and default to HomeIndex
    'Index-Home': {
      meta: { title: '首页' },
      redirect: { name: 'Index-Home-HomeIndex' },
    },
  },
})

// 将生成的路由转换为路由池，用于动态路由匹配
const webRoutePool = flattenRoutesToPool(allWebRoutes)

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
      path: '/:pathMatch(.*)*',
      name: 'StaticCatchAll',
      component: { render: () => null },
    },
  ],
})

permission(router, webRoutePool)

export default router
