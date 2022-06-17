/*
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2022-05-30 14:41:02
 * @LastEditors: houqiangxie
 * @LastEditTime: 2022-05-30 14:50:41
 */
import { useStorage } from 'vue3-storage';
const storage = useStorage();
import { useCommonStore } from '@/store/common';
import {Router} from 'vue-router'
export default (router:Router):void => {
    router.beforeEach((to, from, next) => {
        const params = new URLSearchParams(window.location.hash.replace(/(.*)\?(.*)/g, '$2'));
        const commonStore = useCommonStore()
        commonStore.isIframe = params.get('token') || params.get('isIframe') ? true : false;
        const token = storage.getStorageSync('token')?.token;
        if (to.meta.requiresAuth && !token) {
            next(`/login?returnUrl=${encodeURIComponent(to.fullPath)}`);
        } else {
            next();
        }
    });
}