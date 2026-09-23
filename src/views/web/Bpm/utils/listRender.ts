import { h } from 'vue'
import { NButton, NText, NTooltip } from 'naive-ui'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { BpmProcessInstanceStatus } from '@/utils/constants'

function personName(u: any) {
  return u?.nickname || u?.name || u?.nickName || '-'
}

function deptName(d: any) {
  return d?.name || d?.deptName || '-'
}

/**
 * 模型可见范围：全部可见 / 单人 / 单部门 / N 人 / N 部门
 *（兼容后端 startUsers、startDepts 或仅 ids 时前端已解析的对象）
 */
export function renderModelVisibleScope(row: {
  visible?: boolean
  startUsers?: any[]
  startDepts?: any[]
}) {
  if (row?.visible === false)
    return '不可见'

  const users = Array.isArray(row?.startUsers) ? row.startUsers : []
  const depts = Array.isArray(row?.startDepts) ? row.startDepts : []

  if (!users.length && !depts.length)
    return '全部可见'

  if (users.length === 1 && !depts.length)
    return personName(users[0])

  if (depts.length === 1 && !users.length)
    return deptName(depts[0])

  if (depts.length > 1) {
    const names = depts.map(deptName).join('、')
    const label = `${deptName(depts[0])}等 ${depts.length} 个部门可见`
    return h(NTooltip, null, {
      trigger: () => h('span', { style: 'cursor:default' }, label),
      default: () => names,
    })
  }

  if (users.length > 1) {
    const names = users.map(personName).join('、')
    const label = `${personName(users[0])}等 ${users.length} 人可见`
    return h(NTooltip, null, {
      trigger: () => h('span', { style: 'cursor:default' }, label),
      default: () => names,
    })
  }

  // 人+部门混合：优先展示人数摘要
  if (users.length) {
    const names = [
      ...users.map(personName),
      ...depts.map(deptName),
    ].join('、')
    const label = users.length === 1
      ? personName(users[0])
      : `${personName(users[0])}等 ${users.length} 人可见`
    return h(NTooltip, null, {
      trigger: () => h('span', { style: 'cursor:default' }, label),
      default: () => names,
    })
  }

  return '全部可见'
}

export type BpmSummaryItem = { key?: string, value?: unknown }

/** 摘要列：key : value 纵向展示 */
export function renderBpmSummary(summary: BpmSummaryItem[] | undefined | null) {
  if (!Array.isArray(summary) || !summary.length)
    return '-'
  return h(
    'div',
    { style: 'display:flex;flex-direction:column;gap:2px;' },
    summary.map((item, index) =>
      h(NText, { key: index, depth: 3, style: 'font-size:12px;' }, {
        default: () => `${item.key}: ${String(item.value ?? '')}`,
      }),
    ),
  )
}

function taskAssigneeName(task: any) {
  return task?.assigneeUser?.nickname
    || task?.assigneeUser?.name
    || task?.assigneeUserNickname
    || '-'
}

/**
 * 流程状态列：进行中时展示「张三 (节点) 审批中」；
 * 多人时展示「张三 等 N 人 (节点)审批中」
 */
export function renderProcessInstanceStatus(
  row: any,
  onClick?: (row: any) => void,
) {
  const tasks = Array.isArray(row?.tasks) ? row.tasks : []
  if (row?.status === BpmProcessInstanceStatus.RUNNING && tasks.length > 0) {
    const first = tasks[0]
    const nickname = taskAssigneeName(first)
    const nodeName = first?.name || '审批'
    const nameNode = onClick
      ? h(NButton, { text: true, type: 'primary', onClick: () => onClick(row) }, { default: () => nickname })
      : h('span', null, nickname)
    const suffix = tasks.length === 1
      ? ` (${nodeName}) 审批中`
      : ` 等 ${tasks.length} 人 (${nodeName})审批中`
    return h('span', null, [nameNode, suffix])
  }
  return getDictLabel(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS, row?.status) || '-'
}

/** 从流程实例上解析摘要（兼容嵌套 processInstance.summary） */
export function resolveRowSummary(row: any): BpmSummaryItem[] | undefined {
  if (Array.isArray(row?.summary))
    return row.summary
  if (Array.isArray(row?.processInstance?.summary))
    return row.processInstance.summary
  return undefined
}
