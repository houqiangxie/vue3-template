import type { BuilderField } from '@/components/common/FormBuilder/types'
import {
  normalizeImportedField,
  parseImportedFields,
  toExportFields,
} from '@/components/common/FormBuilder/serialize'

export const BPM_FORM_ENGINE = 'formBuilder' as const

export type BpmFormConf = {
  engine?: typeof BPM_FORM_ENGINE
  version?: number
  formCols?: number
  [key: string]: unknown
}

/** 是否为 FormBuilder 引擎存储的流程表单 */
export function isFormBuilderConf(conf: string | Record<string, any> | null | undefined): boolean {
  if (!conf)
    return false
  try {
    const obj = typeof conf === 'string' ? (conf ? JSON.parse(conf) : {}) : conf
    return obj?.engine === BPM_FORM_ENGINE
  }
  catch {
    return false
  }
}

/** BuilderField → 后端 FormVO.conf / fields */
export function packBpmForm(
  fields: BuilderField[],
  formCols = 2,
): { conf: string, fields: string[] } {
  const exported = toExportFields(fields)
  return {
    conf: JSON.stringify({
      engine: BPM_FORM_ENGINE,
      version: 1,
      formCols,
    } satisfies BpmFormConf),
    fields: exported.map(f => JSON.stringify(f)),
  }
}

/** 后端 FormVO → 设计器字段 */
export function unpackBpmForm(
  conf: string | Record<string, any> | null | undefined,
  fields: Array<string | Record<string, any>> | null | undefined,
): { fields: BuilderField[], formCols: number } {
  let formCols = 2
  try {
    const obj = typeof conf === 'string' ? (conf ? JSON.parse(conf) : {}) : (conf || {})
    if (typeof obj.formCols === 'number' && obj.formCols > 0)
      formCols = obj.formCols
  }
  catch {
    // ignore
  }

  const rawList = (fields || []).map((f) => {
    if (typeof f === 'string') {
      try {
        return JSON.parse(f)
      }
      catch {
        return null
      }
    }
    return f
  }).filter(Boolean) as Record<string, any>[]

  if (!rawList.length)
    return { fields: [], formCols }

  // FormBuilder / UnifiedFieldConfig
  if (rawList.some(item => item.key || item.component)) {
    try {
      return { fields: parseImportedFields(rawList), formCols }
    }
    catch {
      return {
        fields: rawList.map(item => normalizeImportedField(item as any)),
        formCols,
      }
    }
  }

  // 芋道 form-create 遗留：{ field, title, type, $required }
  const converted = rawList.map((rule) => {
    const component = mapFormCreateTypeToComponent(rule.type)
    return normalizeImportedField({
      key: rule.field || rule.key,
      label: rule.title || rule.label || rule.field,
      component,
      form: {
        required: Boolean(rule.$required ?? rule.required),
        span: 1,
      },
      search: false,
      table: false,
      bind: rule.props || {},
    } as any)
  })
  return { fields: converted, formCols }
}

function mapFormCreateTypeToComponent(type?: string): string {
  const map: Record<string, string> = {
    input: 'NInput',
    textarea: 'NInput',
    inputNumber: 'NInputNumber',
    select: 'NSelect',
    radio: 'NRadioGroup',
    checkbox: 'NCheckboxGroup',
    switch: 'NSwitch',
    datePicker: 'NDatePicker',
    timePicker: 'NTimePicker',
    cascader: 'NCascader',
    treeSelect: 'NTreeSelect',
    rate: 'NRate',
    slider: 'NSlider',
    upload: 'NUpload',
  }
  return map[type || ''] || 'NInput'
}

/**
 * 解析流程表单字段元数据（节点权限 / 标题摘要 / 预览标签）
 * 同时兼容 FormBuilder 与 form-create
 */
export function listBpmFormFieldMeta(
  fields: Array<string | Record<string, any>> | null | undefined,
): Array<{ field: string, title: string, type?: string, required?: boolean }> {
  const result: Array<{ field: string, title: string, type?: string, required?: boolean }> = []
  for (const raw of fields || []) {
    let rule: Record<string, any>
    try {
      rule = typeof raw === 'string' ? JSON.parse(raw) : raw
    }
    catch {
      continue
    }
    collectFieldMeta(rule, result)
  }
  return result
}

function collectFieldMeta(
  rule: Record<string, any>,
  out: Array<{ field: string, title: string, type?: string, required?: boolean }>,
  parentTitle = '',
) {
  // FormBuilder
  if (rule.key || rule.component) {
    const field = String(rule.key || '')
    const title = rule.label || field
    if (field && title) {
      out.push({
        field,
        title: parentTitle ? `${parentTitle}.${title}` : title,
        type: rule.component,
        required: Boolean(rule.form && rule.form !== false && rule.form.required),
      })
    }
    if (Array.isArray(rule.children))
      rule.children.forEach((child: any) => collectFieldMeta(child, out, title))
    return
  }

  // form-create
  const { type, field, $required, title: tempTitle, children } = rule
  if (field && tempTitle) {
    const title = parentTitle ? `${parentTitle}.${tempTitle}` : tempTitle
    out.push({
      field,
      title,
      type,
      required: Boolean($required),
    })
  }
  if (Array.isArray(children))
    children.forEach((child: any) => collectFieldMeta(child, out, tempTitle || parentTitle))
}
