import type { FieldOption } from '@/components/common/table/fieldSchema'
import type { PaletteGroup } from './types'

export const STORAGE_KEY = 'form-builder-draft'
/** 是否自动保存草稿的偏好，存 '1' / '0'，缺省视为关闭 */
export const AUTO_SAVE_PREF_KEY = 'form-builder-auto-save'
/** 草稿 schema 版本；加载时兼容无 version 的旧数据 */
export const DRAFT_VERSION = 1
export const HISTORY_LIMIT = 50
/** 属性连续编辑合并为一步历史 / 一次落盘的防抖间隔 */
export const PERSIST_DEBOUNCE_MS = 400

export const DEFAULT_OPTIONS: FieldOption[] = [
  { label: '选项一', value: '1' },
  { label: '选项二', value: '2' },
]

export const DEFAULT_TREE_OPTIONS = [
  {
    label: '浙江省',
    value: 'zj',
    children: [
      { label: '杭州市', value: 'hz' },
      { label: '宁波市', value: 'nb' },
    ],
  },
  {
    label: '江苏省',
    value: 'js',
    children: [
      { label: '南京市', value: 'nj' },
      { label: '苏州市', value: 'sz' },
    ],
  },
]

export const paletteGroups: PaletteGroup[] = [
  {
    name: '基础输入',
    items: [
      { label: '文本', component: 'NInput' },
      { label: '数字输入', component: 'NInputNumber' },
      { label: '自动完成', component: 'NAutoComplete', defaults: { options: [...DEFAULT_OPTIONS] } },
      { label: '提及', component: 'NMention', defaults: { options: [...DEFAULT_OPTIONS] } },
      { label: '验证码', component: 'NInputOtp', defaults: { bind: { length: 6 } } },
      { label: '动态列表', component: 'NDynamicInput', defaults: { form: { span: 2 }, bind: { preset: 'pair', keyPlaceholder: '键', valuePlaceholder: '值' } } },
      { label: '动态标签', component: 'NDynamicTags' },
    ],
  },
  {
    name: '选择器',
    items: [
      { label: '下拉选择', component: 'NSelect', defaults: { options: [...DEFAULT_OPTIONS] } },
      { label: '级联选择', component: 'NCascader', defaults: { options: structuredClone(DEFAULT_TREE_OPTIONS) } },
      { label: '树形选择', component: 'NTreeSelect', defaults: { options: structuredClone(DEFAULT_TREE_OPTIONS) } },
      { label: '穿梭框', component: 'NTransfer', defaults: { options: [...DEFAULT_OPTIONS] } },
    ],
  },
  {
    name: '选项组',
    items: [
      { label: '单选框组', component: 'NRadioGroup', defaults: { options: [{ label: '是', value: '1' }, { label: '否', value: '0' }] } },
      { label: '单选按钮', component: 'NRadioGroup', defaults: { bind: { button: true }, options: [{ label: '是', value: '1' }, { label: '否', value: '0' }] } },
      { label: '复选框组', component: 'NCheckboxGroup', defaults: { options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }] } },
    ],
  },
  {
    name: '日期与其他',
    items: [
      { label: '日期选择', component: 'NDatePicker' },
      { label: '时间选择', component: 'NTimePicker' },
      { label: '开关', component: 'NSwitch' },
      { label: '评分', component: 'NRate' },
      { label: '滑块', component: 'NSlider' },
      { label: '颜色选择', component: 'NColorPicker' },
    ],
  },
  {
    name: '业务组件',
    items: [
      { label: '文件上传', component: 'UploadFile' },
      { label: '图片裁剪', component: 'ImageCropper', defaults: { bind: { aspectRatio: 1, outputSize: 200 } } },
      { label: '富文本', component: 'Editor' },
      { label: '图标选择', component: 'IconSelect' },
      { label: '用户选择', component: 'UserSelect' },
      { label: '部门选择', component: 'DeptSelect', defaults: { bind: { clearable: true, filterable: true, onlyEnabled: true } } },
      { label: 'Cron 表达式', component: 'CronInput' },
      {
        label: 'SQL 条件搜索',
        component: 'SqlSearch',
        defaults: {
          form: { span: 2 },
          search: { span: 24 },
          bind: {
            fields: [
              { key: 'name', label: '名称', type: 'string' },
              {
                key: 'status',
                label: '状态',
                type: 'select',
                options: [
                  { label: '启用', value: '1' },
                  { label: '停用', value: '0' },
                ],
              },
              { key: 'age', label: '年龄', type: 'number' },
              { key: 'createTime', label: '创建时间', type: 'datetime' },
            ],
          },
        },
      },
    ],
  },
]

export const paletteExpandedNames = paletteGroups.map(g => g.name)

export const componentOptions: Array<{ label: string, value: string }> = [
  { label: '文本 (NInput)', value: 'NInput' },
  { label: '数字 (NInputNumber)', value: 'NInputNumber' },
  { label: '自动完成 (NAutoComplete)', value: 'NAutoComplete' },
  { label: '提及 (NMention)', value: 'NMention' },
  { label: '验证码 (NInputOtp)', value: 'NInputOtp' },
  { label: '动态列表 (NDynamicInput)', value: 'NDynamicInput' },
  { label: '动态标签 (NDynamicTags)', value: 'NDynamicTags' },
  { label: '下拉 (NSelect)', value: 'NSelect' },
  { label: '级联 (NCascader)', value: 'NCascader' },
  { label: '树选择 (NTreeSelect)', value: 'NTreeSelect' },
  { label: '穿梭框 (NTransfer)', value: 'NTransfer' },
  { label: '单选组 (NRadioGroup)', value: 'NRadioGroup' },
  { label: '复选组 (NCheckboxGroup)', value: 'NCheckboxGroup' },
  { label: '日期 (NDatePicker)', value: 'NDatePicker' },
  { label: '时间 (NTimePicker)', value: 'NTimePicker' },
  { label: '开关 (NSwitch)', value: 'NSwitch' },
  { label: '评分 (NRate)', value: 'NRate' },
  { label: '滑块 (NSlider)', value: 'NSlider' },
  { label: '颜色 (NColorPicker)', value: 'NColorPicker' },
  { label: '文件上传 (UploadFile)', value: 'UploadFile' },
  { label: '图片裁剪 (ImageCropper)', value: 'ImageCropper' },
  { label: '富文本 (Editor)', value: 'Editor' },
  { label: '图标 (IconSelect)', value: 'IconSelect' },
  { label: '用户 (UserSelect)', value: 'UserSelect' },
  { label: '部门 (DeptSelect)', value: 'DeptSelect' },
  { label: 'Cron (CronInput)', value: 'CronInput' },
  { label: 'SQL 条件搜索 (SqlSearch)', value: 'SqlSearch' },
]

export const inputModeOptions = [
  { label: '单行', value: 'text' },
  { label: '多行', value: 'textarea' },
]

export const patternTypeOptions = [
  { label: '非空', value: 'default' },
  { label: '手机号', value: 'phone' },
  { label: '固话/手机', value: 'phone_number' },
  { label: '区号', value: 'phone_prefix' },
  { label: '电话号码', value: 'phone_suffix' },
  { label: '自定义正则', value: 'custom' },
]

export const datePickerTypeOptions = [
  { label: '日期', value: 'date' },
  { label: '日期时间', value: 'datetime' },
  { label: '日期范围', value: 'daterange' },
  { label: '日期时间范围', value: 'datetimerange' },
  { label: '月份', value: 'month' },
  { label: '月份范围', value: 'monthrange' },
  { label: '年份', value: 'year' },
  { label: '年份范围', value: 'yearrange' },
  { label: '季度', value: 'quarter' },
  { label: '周', value: 'week' },
]

export const timePickerFormatOptions = [
  { label: 'HH:mm:ss', value: 'HH:mm:ss' },
  { label: 'HH:mm', value: 'HH:mm' },
]

export const dynamicInputPresetOptions = [
  { label: '键值对', value: 'pair' },
  { label: '列表', value: 'input' },
]

export const fileTypeOptions = [
  { label: '自动推断', value: '' },
  { label: '字符串', value: 'string' },
  { label: '数字', value: 'number' },
  { label: '布尔', value: 'boolean' },
  { label: '数组', value: 'array' },
]

export const visibilityLogicOptions = [
  { label: '全部满足 (AND)', value: 'and' },
  { label: '任一满足 (OR)', value: 'or' },
]

export const visibilityModeOptions = [
  { label: '无', value: 'none' },
  { label: '显示条件 (visible)', value: 'visible' },
  { label: '隐藏条件 (hidden)', value: 'hidden' },
]

export const tableFixedOptions = [
  { label: '左侧固定', value: 'left' },
  { label: '右侧固定', value: 'right' },
]

export const tableFormatOptions = [
  { label: '选项映射', value: 'option' },
  { label: '日期', value: 'date' },
  { label: '日期时间', value: 'datetime' },
]

export const tableAlignOptions = [
  { label: '左对齐', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '右对齐', value: 'right' },
]

/** 可排序：跟随表格 remote / 强制本地 / 强制远程 */
export const tableSortableOptions = [
  { label: '开启（跟随 remote）', value: 'true' },
  { label: '仅本地', value: 'local' },
  { label: '仅远程', value: 'remote' },
]

/** 可筛选：跟随表格 remote / 强制本地 / 强制远程 */
export const tableFilterOptions = [
  { label: '开启（跟随 remote）', value: 'true' },
  { label: '仅本地', value: 'local' },
  { label: '仅远程', value: 'remote' },
]

export const tableTagTypeOptions = [
  { label: '默认', value: 'default' },
  { label: '主要', value: 'primary' },
  { label: '成功', value: 'success' },
  { label: '信息', value: 'info' },
  { label: '警告', value: 'warning' },
  { label: '错误', value: 'error' },
]

export const IMPORT_EXAMPLE = `[
  {
    "key": "name",
    "label": "名称",
    "component": "NInput",
    "form": { "required": true, "span": 2 },
    "search": { "span": 8 },
    "table": { "minWidth": 140 }
  },
  {
    "key": "status",
    "label": "状态",
    "component": "NSelect",
    "options": [
      { "label": "启用", "value": "1" },
      { "label": "停用", "value": "0" }
    ],
    "form": {
      "required": true,
      "defaultValue": "1"
    },
    "search": { "span": 8, "defaultValue": "1" },
    "table": { "width": 100, "format": "option" }
  },
  {
    "key": "remark",
    "label": "备注",
    "component": "NInput",
    "bind": { "type": "textarea", "rows": 3 },
    "form": { "span": 2, "hiddenExpr": "model.status === '0'" },
    "search": false,
    "table": false
  }
]`

export const PALETTE_DRAG_MIME = 'application/x-form-builder-item'
