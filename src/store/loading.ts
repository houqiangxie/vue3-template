import { defineStore } from 'pinia'

/**
 * 全局轻量加载态：顶部进度条（非全屏遮罩）。
 * - setLoading：显式任务（如下载）
 * - setNavigating：路由切换
 * 列表 / 表单 / 弹窗请用局部 loading。
 */
export const useLoadingStore = defineStore('loading', () => {
  const loadingCount = ref(0)
  const navigating = ref(false)
  const isIframe = ref(false)
  const token = ref<{ [prop: string]: unknown }>()

  const showLoading = computed(() => loadingCount.value > 0 || navigating.value)

  function setLoading(loading: boolean) {
    if (loading) {
      loadingCount.value++
    }
    else if (loadingCount.value > 0) {
      loadingCount.value--
    }
  }

  function setNavigating(value: boolean) {
    navigating.value = value
  }

  return {
    showLoading,
    loadingCount,
    navigating,
    setLoading,
    setNavigating,
    isIframe,
    token,
  }
})
