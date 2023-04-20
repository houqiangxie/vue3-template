/*
 * @Descripttion:
 * @version:
 * @Author: houqiangxie
 * @Date: 2022-03-10 12:24:17
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-04-10 10:08:04
 */
import 'virtual:windi.css';
// import * as echarts from 'echarts';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from '@/router/web';
import emitter from '@/utils/emitter';
import App from './WebApp.vue';
import Particles from "particles.vue3";
import microApp from "@micro-zoe/micro-app";

microApp.start();
// {iframe:true,"disable-patch-request":true,"disable-memory-router":true}
const app = createApp(App);
app.config.globalProperties.$emitter = emitter;
// app.config.globalProperties.$echarts = echarts;
app.use(router).use(createPinia()).use(Particles).mount('#webApp');
