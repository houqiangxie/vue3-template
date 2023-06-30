/*
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2022-05-23 10:20:59
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-06-30 09:56:17
 */
import { createRouter, createWebHashHistory, createWebHistory, RouteRecordRaw } from 'vue-router';
import permission from './permission'
import appRoutes from "~appRoutes";
const routes: Array<RouteRecordRaw> = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/Login.vue"),
  },
  ...appRoutes,
  {
    path: "/:pathMatch(.*)*",
    redirect: { name: "Index-Home-HomeIndex" },
  },
];

const router = createRouter({
  history: createWebHistory('/app'),
  routes, // short for `routes: routes`
});
permission(router)


export default router;
