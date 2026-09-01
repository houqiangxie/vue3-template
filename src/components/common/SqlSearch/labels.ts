import { computed } from 'vue'
import { useT } from '@/hooks/useT'
import type { SqlCompareOperator } from './types'

const OPERATORS: SqlCompareOperator[] = [
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
  'like', 'notLike', 'startsWith', 'endsWith',
  'in', 'notIn', 'isNull', 'isNotNull', 'between',
]

const OPERATOR_FALLBACK: Record<SqlCompareOperator, string> = {
  eq: '等于',
  neq: '不等于',
  gt: '大于',
  gte: '大于等于',
  lt: '小于',
  lte: '小于等于',
  like: '包含',
  notLike: '不包含',
  startsWith: '开头是',
  endsWith: '结尾是',
  in: '在列表中',
  notIn: '不在列表中',
  isNull: '为空',
  isNotNull: '不为空',
  between: '介于',
}

/** SqlSearch 文案（响应 locale；未启用 i18n 时使用中文 fallback） */
export function useSqlSearchLabels() {
  const { t } = useT()

  return computed(() => ({
    group: t('sqlSearch.group', '条件组'),
    nestedGroup: (depth: number) => t('sqlSearch.nestedGroup', `子组 L${depth}`, { depth }),
    logicAnd: t('sqlSearch.logicAnd', '且'),
    logicOr: t('sqlSearch.logicOr', '或'),
    not: t('sqlSearch.not', '非'),
    notCheckbox: t('sqlSearch.notCheckbox', 'NOT'),
    addCondition: t('sqlSearch.addCondition', '+ 条件'),
    addGroup: t('sqlSearch.addGroup', '+ 子组'),
    duplicateCondition: t('sqlSearch.duplicateCondition', '复制'),
    removeGroup: t('sqlSearch.removeGroup', '删除组'),
    removeCondition: t('sqlSearch.removeCondition', '删除条件'),
    collapse: t('sqlSearch.collapse', '收起'),
    expand: t('sqlSearch.expand', '展开'),
    empty: t('sqlSearch.empty', '暂无条件，请添加'),
    noFields: t('sqlSearch.noFields', '未配置搜索字段，请通过 fields 传入字段定义'),
    invalidField: t('sqlSearch.invalidField', '字段已失效，请重新选择'),
    fieldPlaceholder: t('sqlSearch.fieldPlaceholder', '选择字段'),
    valuePlaceholder: t('sqlSearch.valuePlaceholder', '请输入'),
    selectPlaceholder: t('sqlSearch.selectPlaceholder', '请选择'),
    selectMultiplePlaceholder: t('sqlSearch.selectMultiplePlaceholder', '请选择多个'),
    tagPlaceholder: t('sqlSearch.tagPlaceholder', '输入后回车添加'),
    rangeMin: t('sqlSearch.rangeMin', '最小'),
    rangeMax: t('sqlSearch.rangeMax', '最大'),
    rangeStart: t('sqlSearch.rangeStart', '起始'),
    rangeEnd: t('sqlSearch.rangeEnd', '结束'),
    booleanTrue: t('sqlSearch.booleanTrue', '是'),
    booleanFalse: t('sqlSearch.booleanFalse', '否'),
    sqlPreview: t('sqlSearch.sqlPreview', 'SQL 预览'),
    sqlPreviewEmpty: t('sqlSearch.sqlPreviewEmpty', '-- 请完善搜索条件'),
    copySql: t('sqlSearch.copySql', '复制 SQL'),
    copyEmpty: t('sqlSearch.copyEmpty', '暂无内容可复制'),
    incompleteHint: t('sqlSearch.incompleteHint', '请完善此条件'),
    dragHandle: t('sqlSearch.dragHandle', '拖动排序'),
    validateFail: t('sqlSearch.validateFail', '请完善搜索条件'),
  }))
}

export function useOperatorLabels() {
  const { t } = useT()

  return computed(() => {
    const labels = {} as Record<SqlCompareOperator, string>
    for (const op of OPERATORS)
      labels[op] = t(`sqlSearch.operator.${op}`, OPERATOR_FALLBACK[op])
    return labels
  })
}
