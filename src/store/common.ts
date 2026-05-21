/*
 * @Descripttion:
 * @version:
 * @Author: houqiangxie
 * @Date: 2022-03-10 12:32:38
 * @LastEditors: houqiangxie
 * @LastEditTime: 2022-06-17 09:46:23
 */
import { defineStore } from 'pinia';

export const useCommonStore = defineStore('common', () => {
  const loadingCount = ref(0);
  const showLoading = computed(() => loadingCount.value > 0);
  const isIframe = ref<boolean>(false);
  const token = ref<{[prop:string]:any}>();

  function setLoading(loading: boolean) {
    if (loading) {
      loadingCount.value++;
    } else if (loadingCount.value > 0) {
      loadingCount.value--;
    }
  }

  return { showLoading, loadingCount, setLoading, isIframe, token };
});
