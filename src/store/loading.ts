import { defineStore } from 'pinia';

export const useLoadingStore = defineStore('loading', () => {
  const loadingCount = ref(0);
  const showLoading = computed(() => loadingCount.value > 0);
  const isIframe = ref<boolean>(false);
  const token = ref<{ [prop: string]: any }>();

  function setLoading(loading: boolean) {
    if (loading) {
      loadingCount.value++;
    } else if (loadingCount.value > 0) {
      loadingCount.value--;
    }
  }

  return { showLoading, loadingCount, setLoading, isIframe, token };
});
