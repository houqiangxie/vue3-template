/*
 * @Descripttion:
 * @version:
 * @Author: houqiangxie
 * @Date: 2022-03-10 12:24:17
 * @LastEditors: houqiangxie
 * @LastEditTime: 2022-06-17 09:52:08
 */
import 'virtual:windi.css';
// import * as echarts from 'echarts';
import { createApp } from 'vue';
import 'vue-global-api';
import { createPinia } from 'pinia';
import router from '@/router/index';
import emitter from '@/utils/emitter';
import App from './App.vue';
import Particles from "particles.vue3";

const app = createApp(App);
app.config.globalProperties.$emitter = emitter;
// app.config.globalProperties.$echarts = echarts;
app.use(router).use(createPinia()).use(Particles).mount('#app');
