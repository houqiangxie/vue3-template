/*
 * @Descripttion:
 * @version:
 * @Author: houqiangxie
 * @Date: 2022-03-10 12:24:17
 * @LastEditors: houqiangxie
 * @LastEditTime: 2024-10-30 14:02:22
 */
// main.ts
import 'virtual:uno.css'
// import * as echarts from 'echarts';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from '@/router/web';
import emitter from '@/utils/emitter';
import App from './WebApp.vue';
import 'ux-fileviewer/dist/main.css'
import Tmap from 'ux-tmap';
// import Tmap from '@map-component/vue-tmap';
// import Particles from "particles.vue3";
// {iframe:true,"disable-patch-request":true,"disable-memory-router":true}
const app = createApp(App);
app.config.globalProperties.$emitter = emitter;
// app.config.globalProperties.$echarts = echarts;
app.use(router).use(createPinia()).use(Tmap).mount('#webApp');
