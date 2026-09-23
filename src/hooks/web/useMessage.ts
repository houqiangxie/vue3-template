/**
 * BPM 业务侧消息封装，直接走 Naive 全局 Provider（RegisterMessage）。
 */
export function useMessage() {
  const msg = () => (window as any).$message
  const dialog = () => (window as any).$dialog
  const notification = () => (window as any).$notification

  return {
    info(content: string) {
      msg()?.info(content)
    },
    success(content: string) {
      msg()?.success(content)
    },
    warning(content: string) {
      msg()?.warning(content)
    },
    error(content: string) {
      msg()?.error(content)
    },
    notify(content: string) {
      notification()?.info({ content })
    },
    notifySuccess(content: string) {
      notification()?.success({ content })
    },
    notifyWarning(content: string) {
      notification()?.warning({ content })
    },
    notifyError(content: string) {
      notification()?.error({ content })
    },
    confirm(content: string, title = '提示') {
      return new Promise<void>((resolve, reject) => {
        dialog()?.warning({
          title,
          content,
          positiveText: '确定',
          negativeText: '取消',
          onPositiveClick: () => resolve(),
          onNegativeClick: () => reject(),
        })
      })
    },
    prompt(content: string, title = '提示') {
      return new Promise<{ value: string }>((resolve, reject) => {
        dialog()?.warning({
          title,
          content,
          positiveText: '确定',
          negativeText: '取消',
          onPositiveClick: () => resolve({ value: '' }),
          onNegativeClick: () => reject(),
        })
      })
    },
    delConfirm(content = '是否删除所选中数据？', title = '警告') {
      return new Promise<void>((resolve, reject) => {
        dialog()?.warning({
          title,
          content,
          positiveText: '确定',
          negativeText: '取消',
          onPositiveClick: () => resolve(),
          onNegativeClick: () => reject(),
        })
      })
    },
  }
}
