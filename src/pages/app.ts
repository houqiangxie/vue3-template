/*
 * @Descripttion:
 * @version:
 * @Author: houqiangxie
 * @Date: 2022-03-10 12:24:17
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-06-20 10:26:00
 */
import 'virtual:windi.css';
// import * as echarts from 'echarts';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from '@/router/app';
import emitter from '@/utils/emitter';
import App from './App.vue';

const app = createApp(App);
app.config.globalProperties.$emitter = emitter;
// app.config.globalProperties.$echarts = echarts;
app.use(router).use(createPinia()).mount("#appApp");
