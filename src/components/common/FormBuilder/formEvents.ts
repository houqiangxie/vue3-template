import type { BpmFormSettings } from './bpmForm'

/** 对齐 form-create 全局事件 api 的常用方法 */
export type FormEventApi = {
  formData: () => Record<string, unknown>
  getValue: (field: string) => unknown
  setValue: (field: string, value: unknown) => void
  validate: () => Promise<unknown>
  reset: () => void
}

export type FormChangeOptions = {
  formData: Record<string, unknown>
}

export type CompiledFormEvents = {
  onSubmit?: (formData: Record<string, unknown>, api: FormEventApi) => void | Promise<void>
  onReset?: (api: FormEventApi) => void | Promise<void>
  onCreated?: (api: FormEventApi) => void | Promise<void>
  onMounted?: (api: FormEventApi) => void | Promise<void>
  onChange?: (field: string, value: unknown, options: FormChangeOptions) => void
}

function compileBody(args: string[], body: string | undefined): ((...a: unknown[]) => unknown) | undefined {
  const src = body?.trim()
  if (!src)
    return undefined
  try {
    return new Function(...args, src) as (...a: unknown[]) => unknown
  }
  catch {
    return undefined
  }
}

/** 将设计器中的事件函数体编译为可调用 handler */
export function compileFormEvents(
  settings: Pick<
    BpmFormSettings,
    'onSubmitExpr' | 'onResetExpr' | 'onCreatedExpr' | 'onMountedExpr' | 'onChangeExpr'
  >,
): CompiledFormEvents {
  return {
    onSubmit: compileBody(['formData', 'api'], settings.onSubmitExpr) as CompiledFormEvents['onSubmit'],
    onReset: compileBody(['api'], settings.onResetExpr) as CompiledFormEvents['onReset'],
    onCreated: compileBody(['api'], settings.onCreatedExpr) as CompiledFormEvents['onCreated'],
    onMounted: compileBody(['api'], settings.onMountedExpr) as CompiledFormEvents['onMounted'],
    onChange: compileBody(['field', 'value', 'options'], settings.onChangeExpr) as CompiledFormEvents['onChange'],
  }
}

export function createFormEventApi(options: {
  getModel: () => Record<string, unknown>
  setModel: (next: Record<string, unknown>) => void
  validate: () => Promise<unknown>
  reset: () => void
}): FormEventApi {
  return {
    formData: () => options.getModel(),
    getValue: field => options.getModel()[field],
    setValue: (field, value) => {
      options.setModel({ ...options.getModel(), [field]: value })
    },
    validate: options.validate,
    reset: options.reset,
  }
}

/** 深拷贝 model，避免 nested 原地修改污染 snapshot */
export function cloneFormModel(model: Record<string, unknown>): Record<string, unknown> {
  try {
    return structuredClone(model)
  }
  catch {
    try {
      return JSON.parse(JSON.stringify(model)) as Record<string, unknown>
    }
    catch {
      return { ...model }
    }
  }
}

function isDeepEqual(a: unknown, b: unknown): boolean {
  if (a === b)
    return true
  if (a == null || b == null)
    return a === b
  if (typeof a !== typeof b)
    return false
  if (typeof a !== 'object')
    return false
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  }
  catch {
    return false
  }
}

/** 对比前后 model，找出变更字段并触发 form onChange（含 nested） */
export function emitFormFieldChanges(
  prev: Record<string, unknown>,
  next: Record<string, unknown>,
  onChange: CompiledFormEvents['onChange'],
) {
  if (!onChange)
    return
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)])
  for (const key of keys) {
    if (!isDeepEqual(prev[key], next[key]))
      onChange(key, next[key], { formData: next })
  }
}

export const FORM_EVENT_DEFS = [
  {
    key: 'onSubmitExpr' as const,
    label: 'onSubmit',
    hint: '表单提交时触发',
    args: 'formData, api',
    placeholder: '如 console.log(formData)',
  },
  {
    key: 'onResetExpr' as const,
    label: 'onReset',
    hint: '表单重置后触发',
    args: 'api',
    placeholder: '如 console.log(api.formData())',
  },
  {
    key: 'onCreatedExpr' as const,
    label: 'onCreated',
    hint: '表单组件初始化完毕后触发',
    args: 'api',
    placeholder: '如 api.setValue(\'status\', \'1\')',
  },
  {
    key: 'onMountedExpr' as const,
    label: 'onMounted',
    hint: '表单组件渲染完毕后触发',
    args: 'api',
    placeholder: '',
  },
  {
    key: 'onChangeExpr' as const,
    label: 'onChange',
    hint: '表单字段值变化时触发',
    args: 'field, value, options',
    placeholder: '如 console.log(field, value)',
  },
] as const
