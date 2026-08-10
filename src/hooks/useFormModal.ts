/**
 * 新增/编辑弹窗样板：可见性、默认值、提交态
 * getDefaults 在 openCreate/openEdit 时才调用，便于依赖后方定义的 fields
 */
export function useFormModal(getDefaults: () => Record<string, unknown>) {
  const formVisible = ref(false)
  const formData = ref<Record<string, unknown>>({})
  const isEdit = ref(false)
  const submitting = ref(false)

  function openCreate(extra?: Record<string, unknown>) {
    isEdit.value = false
    formData.value = { ...getDefaults(), ...extra }
    formVisible.value = true
  }

  /** 接受任意行对象，避免业务页反复 `as unknown as Record` */
  function openEdit(row: object, extra?: Record<string, unknown>) {
    isEdit.value = true
    formData.value = { ...(row as Record<string, unknown>), ...extra }
    formVisible.value = true
  }

  function close() {
    formVisible.value = false
  }

  async function withSubmit(fn: () => Promise<void>) {
    submitting.value = true
    try {
      await fn()
      formVisible.value = false
    }
    finally {
      submitting.value = false
    }
  }

  return {
    formVisible,
    formData,
    isEdit,
    submitting,
    openCreate,
    openEdit,
    close,
    withSubmit,
  }
}
