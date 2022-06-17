/*
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2022-05-23 10:20:59
 * @LastEditors: houqiangxie
 * @LastEditTime: 2022-06-10 17:55:51
 */
import { createRouter, createWebHashHistory, createWebHistory, RouteRecordRaw } from 'vue-router';
import permission from './permission'
const files :any = import.meta.glob('/src/views/web/**/*.vue')
const indexChildren:any[] = []
Object.keys(files).forEach(key => {
  let path = key.replace(/\/src\/views\/web\/|.vue/g,'')
  let name = key.replace(/\/src\/views\/web(.*)\/|.vue/g, '')
  if (name == 'Index') return;
  if (name == "HomeIndex") path = "";
  indexChildren.push({
    path,
    name,
    component: files[key].default || files[key],
    meta: {
      requiresAuth: true,
    },
  });
})
const routes: Array<RouteRecordRaw> = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/Login.vue"),
    meta: {
      requiresAuth: false,
      hiddenNavBar: true,
    },
  },
  {
    path: "/index",
    name: "Index",
    component: () => import("@/views/web/Index.vue"),
    children: indexChildren,
  },

  {
    path: "/test",
    name: "Test",
    component: () => import("@/views/system/test.vue"),
    meta: {
      requiresAuth: false,
      hiddenNavBar: true,
    },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: { name: "HomeIndex" },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes, // short for `routes: routes`
});
permission(router)


export default router;
