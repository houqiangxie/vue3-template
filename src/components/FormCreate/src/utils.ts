/**
 * 解析表单字段（供 BPM 节点字段权限使用）
 * 兼容 FormBuilder（key/label/component）与芋道 form-create（field/title/type）
 */
export function parseFormFields(
  rule: Record<string, any>,
  fields: Array<Record<string, any>> = [],
  parentTitle = '',
) {
  // FormBuilder / UnifiedFieldConfig
  if (rule.key || rule.component) {
    const field = String(rule.key || '')
    const tempTitle = rule.label || field
    if (field && tempTitle) {
      let title = tempTitle
      if (parentTitle)
        title = `${parentTitle}.${tempTitle}`
      fields.push({
        field,
        title,
        type: rule.component,
        required: Boolean(rule.form && rule.form !== false && rule.form.required),
      })
    }
    if (rule.children && Array.isArray(rule.children))
      rule.children.forEach((child: any) => parseFormFields(child, fields, tempTitle || parentTitle))
    return fields
  }

  const { type, field, $required, title: tempTitle, children } = rule
  if (field && tempTitle) {
    let title = tempTitle
    if (parentTitle)
      title = `${parentTitle}.${tempTitle}`
    fields.push({
      field,
      title,
      type,
      required: Boolean($required),
    })
  }
  if (children && Array.isArray(children)) {
    children.forEach(child => parseFormFields(child, fields))
  }
  return fields
}

export function makeRequiredRule() {
  return {
    type: 'Required',
    field: 'formCreate$required',
    title: '是否必填',
  }
}

/**
 * 将后端表单 conf/fields 写入预览对象（兼容芋道 form-create 数据结构）
 */
export function setConfAndFields2(
  preview: { formData?: Record<string, any>; rule: any[]; option: Record<string, any> },
  conf: string | Record<string, any>,
  fields: Array<string | Record<string, any>>,
) {
  const option = typeof conf === 'string' ? (conf ? JSON.parse(conf) : {}) : (conf || {})
  preview.option = {
    submitBtn: false,
    resetBtn: false,
    ...option,
  }
  preview.rule = (fields || []).map((f) => {
    const rule = typeof f === 'string' ? JSON.parse(f) : f
    return { ...rule, props: { ...rule?.props, disabled: true } }
  })
  preview.formData = preview.formData || {}
}
