import { useDialog, useMessage } from 'naive-ui'

export interface ConfirmDangerOptions {
  title?: string
  content: string
  /** 成功提示，传空字符串则不提示 */
  successMessage?: string
  action: () => Promise<unknown>
}

export interface ConfirmBatchDeleteOptions {
  count: number
  /** 实体名，如「参数」「岗位」 */
  label: string
  action: () => Promise<unknown>
  /** 删除成功后的回调（通常 fetchList） */
  onDone?: () => unknown
}

/**
 * 危险操作确认（批量删除等 dialog.warning 样板）
 */
export function useConfirm() {
  const dialog = useDialog()
  const message = useMessage()

  function confirmDanger(options: ConfirmDangerOptions) {
    const {
      title = '确认',
      content,
      successMessage,
      action,
    } = options

    dialog.warning({
      title,
      content,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        await action()
        if (successMessage)
          message.success(successMessage)
      },
    })
  }

  function confirmBatchDelete(options: ConfirmBatchDeleteOptions) {
    const { count, label, action, onDone } = options
    if (!count)
      return

    confirmDanger({
      title: '确认删除',
      content: `是否确认删除选中的 ${count} 条${label}？`,
      successMessage: '删除成功',
      action: async () => {
        await action()
        await onDone?.()
      },
    })
  }

  return {
    dialog,
    message,
    confirmDanger,
    confirmBatchDelete,
  }
}
