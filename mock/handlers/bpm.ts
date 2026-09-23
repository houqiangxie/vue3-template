import type { MockRoute } from '../utils'
import { fail, ok } from '../utils'
import {
  bpmCategories,
  bpmForms,
  bpmLeaves,
  bpmModels,
  bpmProcessComments,
  bpmProcessCopies,
  bpmProcessDefinitions,
  bpmProcessExpressions,
  bpmProcessInstances,
  bpmProcessListeners,
  bpmTasks,
  bpmUserGroups,
  genBpmCategoryId,
  genBpmCommentId,
  genBpmCopyId,
  genBpmFormId,
  genBpmLeaveId,
  genBpmModelId,
  genBpmProcessDefinitionId,
  genBpmProcessExpressionId,
  genBpmProcessInstanceId,
  genBpmProcessListenerId,
  genBpmTaskId,
  genBpmUserGroupId,
  stampCreateTime,
  users,
  depts,
} from '../data/store'

function bpmPageOk<T>(list: T[], total: number) {
  return ok({ list, total })
}

function resolveStartUsers(ids?: number[]) {
  if (!Array.isArray(ids) || !ids.length)
    return []
  return ids.map((id) => {
    const u = users.find(x => x.userId === id)
    return {
      id,
      name: u?.nickName || `用户${id}`,
      nickname: u?.nickName || `用户${id}`,
    }
  })
}

function resolveStartDepts(ids?: number[]) {
  if (!Array.isArray(ids) || !ids.length)
    return []
  return ids.map((id) => {
    const d = depts.find(x => x.deptId === id)
    return {
      id,
      name: d?.deptName || `部门${id}`,
      deptName: d?.deptName || `部门${id}`,
    }
  })
}

function enrichModelRow(row: any) {
  const form = row.formId ? bpmForms.find((f: any) => f.id === row.formId) : null
  return {
    ...row,
    formName: row.formName || form?.name || '',
    startUsers: Array.isArray(row.startUsers) ? row.startUsers : resolveStartUsers(row.startUserIds),
    startDepts: Array.isArray(row.startDepts) ? row.startDepts : resolveStartDepts(row.startDeptIds),
  }
}

function enrichDefinitionRow(row: any) {
  const form = row.formId ? bpmForms.find((f: any) => f.id === row.formId) : null
  return {
    ...row,
    formName: row.formName || form?.name || '',
    formConf: row.formConf || form?.conf,
    formFields: row.formFields || form?.fields || [],
    startUsers: Array.isArray(row.startUsers) ? row.startUsers : resolveStartUsers(row.startUserIds),
    startDepts: Array.isArray(row.startDepts) ? row.startDepts : resolveStartDepts(row.startDeptIds),
  }
}

function filterByStatus<T extends { status?: number }>(list: T[], status?: string) {
  if (status === undefined || status === '')
    return list
  const n = Number(status)
  return list.filter(i => i.status === n)
}

function paginate<T>(list: T[], pageNo: number, pageSize: number) {
  const start = (pageNo - 1) * pageSize
  return list.slice(start, start + pageSize)
}

const mockCurrentUser = { id: 1, nickname: '超级管理员', avatar: '' }

function nowStr() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function parseTimeMs(value?: string) {
  if (!value)
    return NaN
  const ms = Date.parse(String(value).replace(/-/g, '/'))
  return Number.isFinite(ms) ? ms : NaN
}

function calcDurationMs(start?: string, end?: string) {
  const s = parseTimeMs(start)
  const e = parseTimeMs(end)
  if (!Number.isFinite(s) || !Number.isFinite(e) || e < s)
    return 0
  return e - s
}

function stampTaskDuration(task: any, endTime = nowStr()) {
  task.endTime = endTime
  task.durationInMillis = calcDurationMs(task.createTime, endTime)
  return task
}

function stampInstanceDuration(instance: any, endTime = nowStr()) {
  instance.endTime = endTime
  instance.durationInMillis = calcDurationMs(instance.startTime || instance.createTime, endTime)
  return instance
}

/** 补齐任务节点办理子表单 conf/fields */
function enrichTaskForm(task: any) {
  if (!task?.formId)
    return task
  const form = bpmForms.find(f => f.id === task.formId)
  if (!form)
    return task
  return {
    ...task,
    formName: task.formName || form.name,
    formConf: task.formConf || form.conf,
    formFields: task.formFields || form.fields,
    formVariables: task.formVariables || {},
  }
}

function findDefinition(idOrKey?: string) {
  if (!idOrKey)
    return undefined
  return bpmProcessDefinitions.find(d => d.id === idOrKey || d.key === idOrKey)
}

function buildInstanceSummary(instance: any) {
  const vars = instance?.formVariables || {}
  const entries = Object.entries(vars).slice(0, 3)
  if (!entries.length)
    return []
  return entries.map(([key, value]) => ({ key, value: String(value ?? '') }))
}

function enrichProcessInstanceRow(instance: any) {
  const category = bpmCategories.find(c => c.code === instance.category)
  const runningTasks = bpmTasks
    .filter(t => t.processInstanceId === instance.id && !t.endTime)
    .map(t => ({
      id: t.id,
      name: t.name,
      assigneeUser: t.assigneeUser,
      assigneeUserNickname: t.assigneeUserNickname,
    }))
  return {
    ...instance,
    categoryName: category?.name || instance.category || '',
    summary: instance.summary || buildInstanceSummary(instance),
    tasks: runningTasks,
  }
}

function enrichTaskRow(task: any) {
  const instance = bpmProcessInstances.find(i => i.id === task.processInstanceId)
  const enrichedInstance = instance ? enrichProcessInstanceRow(instance) : null
  return {
    ...task,
    processInstanceName: task.processInstanceName || enrichedInstance?.name || '',
    processInstance: enrichedInstance
      ? {
          id: enrichedInstance.id,
          name: enrichedInstance.name,
          summary: enrichedInstance.summary,
          startUser: enrichedInstance.startUser,
          startUserNickname: enrichedInstance.startUserNickname,
          createTime: enrichedInstance.startTime || enrichedInstance.createTime,
          category: enrichedInstance.category,
          processDefinitionKey: enrichedInstance.processDefinitionKey,
        }
      : undefined,
    summary: enrichedInstance?.summary,
  }
}

/** 兼容 createTime / createTime[0]|[1] / beginTime|endTime */
function parseQueryTimeRange(query: Record<string, any>) {
  let start = ''
  let end = ''
  const ct = query.createTime
  if (Array.isArray(ct) && ct.length >= 2) {
    start = String(ct[0] || '')
    end = String(ct[1] || '')
  }
  else {
    start = String(query['createTime[0]'] || query.beginTime || '')
    end = String(query['createTime[1]'] || query.endTime || '')
  }
  return { start, end }
}

function matchTimeRange(value: string | undefined, start: string, end: string) {
  if (!start && !end)
    return true
  if (!value)
    return false
  const ms = parseTimeMs(value)
  if (!Number.isFinite(ms))
    return false
  if (start) {
    const s = parseTimeMs(start)
    if (Number.isFinite(s) && ms < s)
      return false
  }
  if (end) {
    const e = parseTimeMs(end)
    if (Number.isFinite(e) && ms > e)
      return false
  }
  return true
}

function filterProcessInstances(list: any[], query: Record<string, any>) {
  let result = [...list]
  const name = query.name?.trim()
  const status = query.status
  const category = query.category?.trim()
  const processDefinitionKey = query.processDefinitionKey?.trim()
  const { start, end } = parseQueryTimeRange(query)
  if (name)
    result = result.filter(i => String(i.name).includes(name))
  if (status !== undefined && status !== '')
    result = result.filter(i => i.status === Number(status))
  if (category)
    result = result.filter(i => i.category === category)
  if (processDefinitionKey)
    result = result.filter(i => i.processDefinitionKey === processDefinitionKey)
  if (start || end) {
    result = result.filter(i =>
      matchTimeRange(i.startTime || i.createTime, start, end),
    )
  }
  return result
}

function filterTasks(list: any[], query: Record<string, any>) {
  let result = [...list]
  const name = query.name?.trim()
  const category = query.category?.trim()
  const processDefinitionKey = query.processDefinitionKey?.trim()
  const { start, end } = parseQueryTimeRange(query)
  if (name)
    result = result.filter(i => String(i.name).includes(name))
  if (category || processDefinitionKey || start || end) {
    result = result.filter((task) => {
      const instance = bpmProcessInstances.find(i => i.id === task.processInstanceId)
      if (!instance)
        return false
      if (category && instance.category !== category)
        return false
      if (processDefinitionKey && instance.processDefinitionKey !== processDefinitionKey)
        return false
      if (start || end) {
        if (!matchTimeRange(instance.startTime || instance.createTime, start, end))
          return false
      }
      return true
    })
  }
  return result
}

function resolveDefinitionForm(def: any) {
  if (!def)
    return { formConf: '', formFields: [] as string[] }
  if (def.formType === 10 && def.formId) {
    const form = bpmForms.find(f => f.id === def.formId)
    if (form)
      return { formConf: form.conf, formFields: form.fields }
  }
  return { formConf: def.formConf || '', formFields: def.formFields || [] }
}

/** 解析 simpleModel 为节点链 */
function parseSimpleModel(def: any): any | null {
  if (!def?.simpleModel)
    return null
  try {
    return typeof def.simpleModel === 'string' ? JSON.parse(def.simpleModel) : def.simpleModel
  }
  catch {
    return null
  }
}

/** 收集审批类用户任务节点（type 11/12/13…） */
function collectUserTaskNodes(root: any): any[] {
  const list: any[] = []
  let node = root
  while (node) {
    const t = Number(node.type)
    if (t === 11 || t === 12 || t === 13)
      list.push(node)
    node = node.childNode
  }
  return list
}

function getProcessUserTaskNodes(def: any): { id: string, name: string }[] {
  const model = parseSimpleModel(def)
  if (model) {
    const nodes = collectUserTaskNodes(model)
    if (nodes.length)
      return nodes.map(n => ({ id: n.id, name: n.name || '审批' }))
  }
  if (def?.modelType === 10)
    return [{ id: 'approveTask', name: '财务审批' }]
  return [{ id: 'UserTask_1', name: '审批' }]
}

function findNextUserTask(def: any, currentKey?: string): { id: string, name: string } | null {
  const nodes = getProcessUserTaskNodes(def)
  if (!nodes.length)
    return null
  if (!currentKey)
    return nodes[0]
  const idx = nodes.findIndex(n => n.id === currentKey)
  if (idx < 0)
    return nodes[0]
  return nodes[idx + 1] || null
}

function buildReturnCandidates(def: any, currentKey?: string): { taskDefinitionKey: string, name: string }[] {
  const result: { taskDefinitionKey: string, name: string }[] = [
    { taskDefinitionKey: 'StartUserNode', name: '发起人' },
  ]
  const nodes = getProcessUserTaskNodes(def)
  for (const n of nodes) {
    if (currentKey && n.id === currentKey)
      break
    result.push({ taskDefinitionKey: n.id, name: n.name })
  }
  return result
}

function buildFormFieldsPermission(def: any, editable: boolean): Record<string, string> {
  const { formFields } = resolveDefinitionForm(def)
  const permission: Record<string, string> = {}
  for (const raw of formFields || []) {
    try {
      const field = typeof raw === 'string' ? JSON.parse(raw) : raw
      // FormBuilder 用 key；yudao/form-create 常用 field / vModel
      const key = field?.key || field?.field || field?.vModel || field?.__vModel__
      if (key)
        permission[String(key)] = editable ? '2' : '1' // WRITE / READ
    }
    catch {
      // ignore malformed
    }
  }
  return permission
}

function createNextTask(instance: any, def: any, node: { id: string, name: string }) {
  bpmTasks.unshift(stampCreateTime({
    id: genBpmTaskId(),
    name: node.name,
    processInstanceId: instance.id,
    processInstanceName: instance.name,
    taskDefinitionKey: node.id,
    assigneeUser: { ...mockCurrentUser },
    assigneeUserNickname: mockCurrentUser.nickname,
    ownerUser: { ...mockCurrentUser },
    endTime: '',
    durationInMillis: 0,
    status: 1,
    reason: '',
    ...(def?.key === 'oa_leave'
      ? { formId: 3, formName: '审批办理表单', formVariables: {} }
      : {}),
  }))
}

function buildActivityNodes(instance: any, def: any) {
  const relatedTasks = bpmTasks.filter(t => t.processInstanceId === instance.id)
  const startNode = {
    id: 'StartUserNode',
    name: '发起人',
    nodeType: 10,
    status: 2,
    startTime: instance.startTime || instance.createTime,
    endTime: instance.startTime || instance.createTime,
    durationInMillis: 0,
    candidateUsers: [],
    tasks: [{
      id: `start-${instance.id}`,
      ownerUser: instance.startUser || mockCurrentUser,
      assigneeUser: instance.startUser || mockCurrentUser,
      status: 2,
      reason: '提交申请',
      signPicUrl: '',
    }],
  }

  const userNodes = getProcessUserTaskNodes(def)
  const approveNodes = userNodes.map((node) => {
    const nodeTasks = relatedTasks.filter(t => t.taskDefinitionKey === node.id)
    const running = nodeTasks.find(t => !t.endTime)
    const done = nodeTasks.some(t => t.endTime && t.status === 2)
    const status = running
      ? 1
      : done
        ? 2
        : instance.status === 3
          ? 3
          : instance.status === 4
            ? 4
            : -1
    return {
      id: node.id,
      name: node.name,
      nodeType: 11,
      status,
      startTime: nodeTasks[0]?.createTime,
      endTime: running ? undefined : (nodeTasks[nodeTasks.length - 1]?.endTime || undefined),
      durationInMillis: nodeTasks.reduce((sum, t) => sum + (t.durationInMillis || 0), 0),
      candidateUsers: running ? [running.assigneeUser || mockCurrentUser] : [],
      tasks: nodeTasks.map(t => ({
        id: t.id,
        ownerUser: t.ownerUser || t.assigneeUser || mockCurrentUser,
        assigneeUser: t.assigneeUser || mockCurrentUser,
        status: t.status,
        reason: t.reason || '',
        signPicUrl: t.signPicUrl || '',
      })),
    }
  })

  // 兼容旧数据：任务未带 definitionKey 时回退为单节点
  if (!approveNodes.length || (relatedTasks.length && approveNodes.every(n => !n.tasks.length))) {
    const runningTask = relatedTasks.find(t => !t.endTime)
    const approveStatus = runningTask
      ? 1
      : (instance.status === 3 ? 3 : instance.status === 4 ? 4 : relatedTasks.some(t => t.status === 2) ? 2 : 0)
    const fallbackId = userNodes[0]?.id || 'UserTask_1'
    const fallbackName = userNodes[0]?.name || '审批'
    approveNodes.splice(0, approveNodes.length, {
      id: fallbackId,
      name: fallbackName,
      nodeType: 11,
      status: approveStatus,
      startTime: relatedTasks[0]?.createTime,
      endTime: runningTask ? undefined : (relatedTasks[relatedTasks.length - 1]?.endTime || undefined),
      durationInMillis: relatedTasks.reduce((sum, t) => sum + (t.durationInMillis || 0), 0),
      candidateUsers: runningTask ? [runningTask.assigneeUser || mockCurrentUser] : [],
      tasks: relatedTasks.map(t => ({
        id: t.id,
        ownerUser: t.ownerUser || t.assigneeUser || mockCurrentUser,
        assigneeUser: t.assigneeUser || mockCurrentUser,
        status: t.status,
        reason: t.reason || '',
        signPicUrl: t.signPicUrl || '',
      })),
    })
  }

  const endNode = {
    id: 'EndEvent',
    name: '结束',
    nodeType: 1,
    status: instance.endTime ? 2 : -1,
    startTime: instance.endTime || undefined,
    endTime: instance.endTime || undefined,
    durationInMillis: instance.durationInMillis
      || calcDurationMs(instance.startTime || instance.createTime, instance.endTime),
    candidateUsers: [],
    tasks: [],
  }

  return [startNode, ...approveNodes, endNode]
}

function createRuntimeInstance(def: any, variables: Record<string, unknown> = {}) {
  const piId = genBpmProcessInstanceId()
  const instance = stampCreateTime({
    id: piId,
    name: `${mockCurrentUser.nickname}的${def.name}`,
    category: def.category,
    status: 1,
    processDefinitionId: def.id,
    processDefinitionKey: def.key,
    businessKey: '',
    startUser: { ...mockCurrentUser },
    startUserNickname: mockCurrentUser.nickname,
    startTime: nowStr(),
    endTime: '',
    formVariables: { ...variables },
  })
  bpmProcessInstances.unshift(instance)

  const taskId = genBpmTaskId()
  let taskName = '审批'
  let taskDefinitionKey = 'UserTask_1'
  if (def.modelType === 10) {
    taskName = '财务审批'
    taskDefinitionKey = 'approveTask'
  }
  else if (def.simpleModel) {
    try {
      const model = typeof def.simpleModel === 'string' ? JSON.parse(def.simpleModel) : def.simpleModel
      if (model?.childNode) {
        taskName = model.childNode.name || taskName
        taskDefinitionKey = model.childNode.id || taskDefinitionKey
      }
    }
    catch { /* ignore */ }
  }

  bpmTasks.unshift(stampCreateTime({
    id: taskId,
    name: taskName,
    processInstanceId: piId,
    processInstanceName: instance.name,
    taskDefinitionKey,
    assigneeUser: { ...mockCurrentUser },
    assigneeUserNickname: mockCurrentUser.nickname,
    ownerUser: { ...mockCurrentUser },
    endTime: '',
    durationInMillis: 0,
    status: 1,
    reason: '',
    // 请假类演示办理子表单
    ...(def.key === 'oa_leave'
      ? { formId: 3, formName: '审批办理表单', formVariables: {} }
      : {}),
  }))

  return piId
}

export const bpmRoutes: MockRoute[] = [
  // —— 流程分类 ——
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/category/page',
    handler: (req) => {
      const pageNo = Number(req.query.pageNo || 1)
      const pageSize = Number(req.query.pageSize || 10)
      let list = [...bpmCategories]
      const name = req.query.name?.trim()
      const code = req.query.code?.trim()
      if (name)
        list = list.filter(i => i.name.includes(name))
      if (code)
        list = list.filter(i => i.code.includes(code))
      list = filterByStatus(list, req.query.status)
      list.sort((a, b) => a.sort - b.sort)
      return bpmPageOk(paginate(list, pageNo, pageSize), list.length)
    },
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/category/simple-list',
    handler: () => ok(bpmCategories.filter(i => i.status === 0).map(({ id, name, code, sort }) => ({ id, name, code, sort }))),
  },
  {
    method: 'PUT',
    path: '/jgzf-flowable/bpm/category/update-sort-batch',
    handler: (req) => {
      const ids = String(req.query.ids || '')
        .split(',')
        .map(Number)
        .filter(Boolean)
      if (!ids.length)
        return fail('排序参数为空')
      ids.forEach((id, index) => {
        const row = bpmCategories.find(c => c.id === id)
        if (row)
          row.sort = index + 1
      })
      bpmCategories.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
      return ok(true)
    },
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/category/get',
    handler: (req) => {
      const id = Number(req.query.id)
      const row = bpmCategories.find(i => i.id === id)
      if (!row)
        return fail('分类不存在')
      return ok({ ...row })
    },
  },
  {
    method: 'POST',
    path: '/jgzf-flowable/bpm/category/create',
    handler: (req) => {
      const body = req.body || {}
      if (!body.name || !body.code)
        return fail('分类名和标志不能为空')
      const row = stampCreateTime({
        id: genBpmCategoryId(),
        name: body.name,
        code: body.code,
        status: body.status ?? 0,
        sort: Number(body.sort ?? 0),
      })
      bpmCategories.push(row)
      return ok(row.id)
    },
  },
  {
    method: 'PUT',
    path: '/jgzf-flowable/bpm/category/update',
    handler: (req) => {
      const body = req.body || {}
      const idx = bpmCategories.findIndex(i => i.id === body.id)
      if (idx < 0)
        return fail('分类不存在')
      bpmCategories[idx] = { ...bpmCategories[idx], ...body, id: bpmCategories[idx].id }
      return ok(true)
    },
  },
  {
    method: 'DELETE',
    path: '/jgzf-flowable/bpm/category/delete',
    handler: (req) => {
      const id = Number(req.query.id)
      const idx = bpmCategories.findIndex(i => i.id === id)
      if (idx < 0)
        return fail('分类不存在')
      bpmCategories.splice(idx, 1)
      return ok(true)
    },
  },

  // —— 流程表单 ——
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/form/page',
    handler: (req) => {
      const pageNo = Number(req.query.pageNo || req.query.pageNum || 1)
      const pageSize = Number(req.query.pageSize || 10)
      let list = [...bpmForms]
      const name = String(req.query.name || '').trim()
      if (name)
        list = list.filter(i => String(i.name || '').includes(name))
      return bpmPageOk(paginate(list, pageNo, pageSize), list.length)
    },
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/form/simple-list',
    handler: () => ok(bpmForms.filter(i => i.status === 0).map(({ id, name }) => ({ id, name }))),
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/form/get',
    handler: (req) => {
      const id = Number(req.query.id)
      const row = bpmForms.find(i => i.id === id)
      if (!row)
        return fail('表单不存在')
      return ok({ ...row, fields: Array.isArray(row.fields) ? [...row.fields] : [] })
    },
  },
  {
    method: 'POST',
    path: '/jgzf-flowable/bpm/form/create',
    handler: (req) => {
      const body = req.body || {}
      if (!body.name)
        return fail('表单名不能为空')
      const row = stampCreateTime({
        id: genBpmFormId(),
        name: body.name,
        conf: body.conf || JSON.stringify({ engine: 'formBuilder', version: 1, formCols: 2 }),
        fields: Array.isArray(body.fields) ? body.fields : [],
        status: body.status ?? 0,
        remark: body.remark || '',
      })
      bpmForms.unshift(row)
      return ok(row.id)
    },
  },
  {
    method: 'PUT',
    path: '/jgzf-flowable/bpm/form/update',
    handler: (req) => {
      const body = req.body || {}
      const id = Number(body.id)
      const idx = bpmForms.findIndex(i => i.id === id)
      if (idx < 0)
        return fail('表单不存在')
      const prev = bpmForms[idx]
      bpmForms[idx] = {
        ...prev,
        name: body.name ?? prev.name,
        status: body.status ?? prev.status,
        remark: body.remark ?? prev.remark,
        conf: body.conf ?? prev.conf,
        fields: Array.isArray(body.fields) ? body.fields : prev.fields,
        id: prev.id,
      }
      return ok(true)
    },
  },
  {
    method: 'DELETE',
    path: '/jgzf-flowable/bpm/form/delete',
    handler: (req) => {
      const id = Number(req.query.id)
      const idx = bpmForms.findIndex(i => i.id === id)
      if (idx < 0)
        return fail('表单不存在')
      bpmForms.splice(idx, 1)
      return ok(true)
    },
  },

  // —— 用户组 ——
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/user-group/page',
    handler: (req) => {
      const pageNo = Number(req.query.pageNo || 1)
      const pageSize = Number(req.query.pageSize || 10)
      let list = [...bpmUserGroups]
      const name = req.query.name?.trim()
      if (name)
        list = list.filter(i => i.name.includes(name))
      list = filterByStatus(list, req.query.status)
      return bpmPageOk(paginate(list, pageNo, pageSize), list.length)
    },
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/user-group/simple-list',
    handler: () => ok(bpmUserGroups.filter(i => i.status === 0)),
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/user-group/get',
    handler: (req) => {
      const id = Number(req.query.id)
      const row = bpmUserGroups.find(i => i.id === id)
      if (!row)
        return fail('用户组不存在')
      return ok({ ...row })
    },
  },
  {
    method: 'POST',
    path: '/jgzf-flowable/bpm/user-group/create',
    handler: (req) => {
      const body = req.body || {}
      if (!body.name)
        return fail('组名不能为空')
      const row = stampCreateTime({
        id: genBpmUserGroupId(),
        name: body.name,
        description: body.description || '',
        userIds: body.userIds || [],
        status: body.status ?? 0,
        remark: body.remark || '',
      })
      bpmUserGroups.push(row)
      return ok(row.id)
    },
  },
  {
    method: 'PUT',
    path: '/jgzf-flowable/bpm/user-group/update',
    handler: (req) => {
      const body = req.body || {}
      const idx = bpmUserGroups.findIndex(i => i.id === body.id)
      if (idx < 0)
        return fail('用户组不存在')
      bpmUserGroups[idx] = { ...bpmUserGroups[idx], ...body, id: bpmUserGroups[idx].id }
      return ok(true)
    },
  },
  {
    method: 'DELETE',
    path: '/jgzf-flowable/bpm/user-group/delete',
    handler: (req) => {
      const id = Number(req.query.id)
      const idx = bpmUserGroups.findIndex(i => i.id === id)
      if (idx < 0)
        return fail('用户组不存在')
      bpmUserGroups.splice(idx, 1)
      return ok(true)
    },
  },

  // —— 流程监听器 ——
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/process-listener/page',
    handler: (req) => {
      const pageNo = Number(req.query.pageNo || 1)
      const pageSize = Number(req.query.pageSize || 10)
      let list = [...bpmProcessListeners]
      const name = req.query.name?.trim()
      const event = req.query.event?.trim()
      const type = req.query.type?.trim()
      if (name)
        list = list.filter(i => i.name.includes(name))
      if (event)
        list = list.filter(i => i.event.includes(event))
      if (type)
        list = list.filter(i => i.type === type)
      list = filterByStatus(list, req.query.status)
      return bpmPageOk(paginate(list, pageNo, pageSize), list.length)
    },
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/process-listener/get',
    handler: (req) => {
      const id = Number(req.query.id)
      const row = bpmProcessListeners.find(i => i.id === id)
      if (!row)
        return fail('监听器不存在')
      return ok({ ...row })
    },
  },
  {
    method: 'POST',
    path: '/jgzf-flowable/bpm/process-listener/create',
    handler: (req) => {
      const body = req.body || {}
      if (!body.name || !body.value)
        return fail('名字和值不能为空')
      const row = {
        id: genBpmProcessListenerId(),
        name: body.name,
        type: body.type || 'execution',
        status: body.status ?? 0,
        event: body.event || 'start',
        valueType: body.valueType || 'class',
        value: body.value,
      }
      bpmProcessListeners.push(row)
      return ok(row.id)
    },
  },
  {
    method: 'PUT',
    path: '/jgzf-flowable/bpm/process-listener/update',
    handler: (req) => {
      const body = req.body || {}
      const idx = bpmProcessListeners.findIndex(i => i.id === body.id)
      if (idx < 0)
        return fail('监听器不存在')
      bpmProcessListeners[idx] = { ...bpmProcessListeners[idx], ...body, id: bpmProcessListeners[idx].id }
      return ok(true)
    },
  },
  {
    method: 'DELETE',
    path: '/jgzf-flowable/bpm/process-listener/delete',
    handler: (req) => {
      const id = Number(req.query.id)
      const idx = bpmProcessListeners.findIndex(i => i.id === id)
      if (idx < 0)
        return fail('监听器不存在')
      bpmProcessListeners.splice(idx, 1)
      return ok(true)
    },
  },

  // —— 流程表达式 ——
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/process-expression/page',
    handler: (req) => {
      const pageNo = Number(req.query.pageNo || 1)
      const pageSize = Number(req.query.pageSize || 10)
      let list = [...bpmProcessExpressions]
      const name = req.query.name?.trim()
      if (name)
        list = list.filter(i => i.name.includes(name))
      list = filterByStatus(list, req.query.status)
      return bpmPageOk(paginate(list, pageNo, pageSize), list.length)
    },
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/process-expression/get',
    handler: (req) => {
      const id = Number(req.query.id)
      const row = bpmProcessExpressions.find(i => i.id === id)
      if (!row)
        return fail('表达式不存在')
      return ok({ ...row })
    },
  },
  {
    method: 'POST',
    path: '/jgzf-flowable/bpm/process-expression/create',
    handler: (req) => {
      const body = req.body || {}
      if (!body.name || !body.expression)
        return fail('名字和表达式不能为空')
      const row = {
        id: genBpmProcessExpressionId(),
        name: body.name,
        status: body.status ?? 0,
        expression: body.expression,
      }
      bpmProcessExpressions.push(row)
      return ok(row.id)
    },
  },
  {
    method: 'PUT',
    path: '/jgzf-flowable/bpm/process-expression/update',
    handler: (req) => {
      const body = req.body || {}
      const idx = bpmProcessExpressions.findIndex(i => i.id === body.id)
      if (idx < 0)
        return fail('表达式不存在')
      bpmProcessExpressions[idx] = { ...bpmProcessExpressions[idx], ...body, id: bpmProcessExpressions[idx].id }
      return ok(true)
    },
  },
  {
    method: 'DELETE',
    path: '/jgzf-flowable/bpm/process-expression/delete',
    handler: (req) => {
      const id = Number(req.query.id)
      const idx = bpmProcessExpressions.findIndex(i => i.id === id)
      if (idx < 0)
        return fail('表达式不存在')
      bpmProcessExpressions.splice(idx, 1)
      return ok(true)
    },
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/process-expression/export-excel',
    handler: () => {
      const header = 'id,name,status,expression\n'
      const rows = bpmProcessExpressions
        .map(e => `${e.id},"${e.name}",${e.status},"${String(e.expression || '').replace(/"/g, '""')}"`)
        .join('\n')
      return {
        __raw: true as const,
        body: `\uFEFF${header}${rows}`,
        contentType: 'application/vnd.ms-excel;charset=utf-8',
        headers: {
          'Content-Disposition': 'attachment; filename=process-expression.csv',
        },
      }
    },
  },

  // —— OA 请假 ——
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/oa/leave/page',
    handler: (req) => {
      const pageNo = Number(req.query.pageNo || 1)
      const pageSize = Number(req.query.pageSize || 10)
      let list = [...bpmLeaves]
      const reason = req.query.reason?.trim()
      const type = req.query.type
      if (reason)
        list = list.filter(i => i.reason.includes(reason))
      if (type !== undefined && type !== '')
        list = list.filter(i => i.type === Number(type))
      return bpmPageOk(paginate(list, pageNo, pageSize), list.length)
    },
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/oa/leave/get',
    handler: (req) => {
      const id = Number(req.query.id)
      const row = bpmLeaves.find(i => i.id === id)
      if (!row)
        return fail('请假单不存在')
      return ok({ ...row })
    },
  },
  {
    method: 'POST',
    path: '/jgzf-flowable/bpm/oa/leave/create',
    handler: (req) => {
      const body = req.body || {}
      if (!body.type || !body.startTime || !body.endTime || !body.reason)
        return fail('请假信息不完整')
      const def = findDefinition('oa_leave') || bpmProcessDefinitions[0]
      const processInstanceId = createRuntimeInstance(def, {
        type: Number(body.type),
        reason: body.reason,
        startTime: body.startTime,
        endTime: body.endTime,
      })
      const row = stampCreateTime({
        id: genBpmLeaveId(),
        status: 1,
        type: Number(body.type),
        reason: body.reason,
        processInstanceId,
        startTime: body.startTime,
        endTime: body.endTime,
      })
      bpmLeaves.unshift(row)
      const instance = bpmProcessInstances.find(i => i.id === processInstanceId)
      if (instance)
        instance.businessKey = String(row.id)
      return ok(row.id)
    },
  },

  // —— 流程模型 ——
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/model/list',
    handler: (req) => {
      let list = [...bpmModels]
      const name = req.query.name?.trim()
      if (name)
        list = list.filter(i => String(i.name).includes(name))
      return ok(list.map(enrichModelRow))
    },
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/model/get',
    handler: (req) => {
      const id = Number(req.query.id)
      const row = bpmModels.find(i => i.id === id)
      if (!row)
        return fail('模型不存在')
      return ok(enrichModelRow(row))
    },
  },
  {
    method: 'POST',
    path: '/jgzf-flowable/bpm/model/create',
    handler: (req) => {
      const body = req.body || {}
      if (!body.name || !body.key)
        return fail('流程名称和标识不能为空')
      const row = stampCreateTime({
        id: genBpmModelId(),
        name: body.name,
        key: body.key,
        category: body.category || 'default',
        type: body.type ?? 20,
        formType: body.formType ?? 10,
        formId: body.formId,
        formCustomCreatePath: body.formCustomCreatePath || '',
        formCustomViewPath: body.formCustomViewPath || '',
        visible: body.visible ?? true,
        status: 0,
        description: body.description || '',
        managerUserIds: body.managerUserIds || [],
        startUserIds: body.startUserIds || [],
        startDeptIds: body.startDeptIds || [],
        icon: body.icon,
        bpmnXml: body.bpmnXml || '',
        simpleModel: body.simpleModel,
        allowCancelRunningProcess: body.allowCancelRunningProcess ?? true,
        processIdRule: body.processIdRule,
        autoApprovalType: body.autoApprovalType,
        titleSetting: body.titleSetting,
        summarySetting: body.summarySetting,
        allowWithdrawTask: body.allowWithdrawTask ?? false,
        printTemplateSetting: body.printTemplateSetting,
        processBeforeTriggerSetting: body.processBeforeTriggerSetting,
        processAfterTriggerSetting: body.processAfterTriggerSetting,
        taskBeforeTriggerSetting: body.taskBeforeTriggerSetting,
        taskAfterTriggerSetting: body.taskAfterTriggerSetting,
      })
      bpmModels.unshift(row)
      return ok(row.id)
    },
  },
  {
    method: 'PUT',
    path: '/jgzf-flowable/bpm/model/update',
    handler: (req) => {
      const body = req.body || {}
      const idx = bpmModels.findIndex(i => i.id === body.id)
      if (idx < 0)
        return fail('模型不存在')
      const prev = bpmModels[idx]
      bpmModels[idx] = {
        ...prev,
        ...body,
        id: prev.id,
        processDefinition: body.processDefinition || prev.processDefinition,
      }
      return ok(true)
    },
  },
  {
    method: 'DELETE',
    path: '/jgzf-flowable/bpm/model/delete',
    handler: (req) => {
      const id = Number(req.query.id)
      const idx = bpmModels.findIndex(i => i.id === id)
      if (idx < 0)
        return fail('模型不存在')
      bpmModels.splice(idx, 1)
      return ok(true)
    },
  },
  {
    method: 'POST',
    path: '/jgzf-flowable/bpm/model/deploy',
    handler: (req) => {
      const id = Number(req.query.id)
      const row = bpmModels.find(i => i.id === id)
      if (!row)
        return fail('模型不存在')
      const prevVersion = row.processDefinition?.version || 0
      const version = prevVersion + 1
      const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ')
      const definitionId = genBpmProcessDefinitionId(row.key, version)
      const definition = {
        id: definitionId,
        key: row.key,
        name: row.name,
        version,
        category: row.category,
        modelId: row.id,
        modelType: row.type,
        formType: row.formType,
        formId: row.formId,
        formCustomCreatePath: row.formCustomCreatePath,
        formCustomViewPath: row.formCustomViewPath,
        suspensionState: 1,
        deploymentTime: nowStr,
        deploymentTIme: nowStr,
        simpleModel: row.simpleModel ? JSON.stringify(row.simpleModel) : '',
        bpmnXml: row.bpmnXml || '',
        description: row.description || '',
        managerUserIds: row.managerUserIds || [],
        startUserIds: row.startUserIds || [],
        startDeptIds: row.startDeptIds || [],
        icon: row.icon,
        visible: row.visible,
        allowCancelRunningProcess: row.allowCancelRunningProcess,
        allowWithdrawTask: row.allowWithdrawTask,
        processIdRule: row.processIdRule,
        autoApprovalType: row.autoApprovalType,
        titleSetting: row.titleSetting,
        summarySetting: row.summarySetting,
        printTemplateSetting: row.printTemplateSetting,
        processBeforeTriggerSetting: row.processBeforeTriggerSetting,
        processAfterTriggerSetting: row.processAfterTriggerSetting,
        taskBeforeTriggerSetting: row.taskBeforeTriggerSetting,
        taskAfterTriggerSetting: row.taskAfterTriggerSetting,
      }
      bpmProcessDefinitions.unshift(definition)
      row.processDefinition = {
        id: definitionId,
        version,
        suspensionState: 1,
        deploymentTime: nowStr,
        deploymentTIme: nowStr,
        formType: row.formType,
      }
      row.status = 0
      return ok(true)
    },
  },
  {
    method: 'PUT',
    path: '/jgzf-flowable/bpm/model/update-state',
    handler: (req) => {
      const body = req.body || {}
      const row = bpmModels.find(i => i.id === Number(body.id))
      if (!row)
        return fail('模型不存在')
      if (!row.processDefinition)
        return fail('流程尚未发布')
      const state = Number(body.state)
      row.processDefinition.suspensionState = state
      const def = bpmProcessDefinitions.find(d => d.id === row.processDefinition.id)
      if (def)
        def.suspensionState = state
      return ok(true)
    },
  },
  {
    method: 'DELETE',
    path: '/jgzf-flowable/bpm/model/clean',
    handler: (req) => {
      const id = Number(req.query.id)
      const row = bpmModels.find(i => i.id === id)
      if (!row)
        return fail('模型不存在')
      const key = row.key
      for (let i = bpmProcessInstances.length - 1; i >= 0; i--) {
        if (String(bpmProcessInstances[i].name).includes(row.name) || bpmProcessInstances[i].category === row.category) {
          // 仅清理与该模型名称匹配的示例实例（mock 简化）
          if (bpmProcessInstances[i].name === row.name)
            bpmProcessInstances.splice(i, 1)
        }
      }
      void key
      return ok(true)
    },
  },
  {
    method: 'PUT',
    path: '/jgzf-flowable/bpm/model/update-sort-batch',
    handler: (req) => {
      const ids = String(req.query.ids || '')
        .split(',')
        .map(Number)
        .filter(Boolean)
      if (!ids.length)
        return fail('排序参数为空')
      const map = new Map(bpmModels.map(m => [m.id, m]))
      const ordered: typeof bpmModels = []
      for (const id of ids) {
        const row = map.get(id)
        if (row) {
          ordered.push(row)
          map.delete(id)
        }
      }
      bpmModels.splice(0, bpmModels.length, ...ordered, ...map.values())
      return ok(true)
    },
  },
  {
    method: 'PUT',
    path: '/jgzf-flowable/bpm/model/update-bpmn',
    handler: (req) => {
      const body = req.body || {}
      const idx = bpmModels.findIndex(i => i.id === body.id)
      if (idx < 0)
        return fail('模型不存在')
      if (body.bpmnXml != null)
        bpmModels[idx].bpmnXml = body.bpmnXml
      if (body.simpleModel != null)
        bpmModels[idx].simpleModel = body.simpleModel
      return ok(true)
    },
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/model/simple/get',
    handler: (req) => {
      const id = Number(req.query.id)
      const row = bpmModels.find(i => i.id === id)
      if (!row)
        return fail('模型不存在')
      const model = row.simpleModel
        ? (typeof row.simpleModel === 'string' ? JSON.parse(row.simpleModel) : row.simpleModel)
        : null
      return ok(model)
    },
  },
  {
    method: 'POST',
    path: '/jgzf-flowable/bpm/model/simple/update',
    handler: (req) => {
      const body = req.body || {}
      const id = Number(body.id)
      const idx = bpmModels.findIndex(i => i.id === id)
      if (idx < 0)
        return fail('模型不存在')
      bpmModels[idx].simpleModel = body.simpleModel ?? body
      return ok(true)
    },
  },

  // —— 流程定义 ——
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/process-definition/get',
    handler: (req) => {
      let row = null as any
      if (req.query.id)
        row = bpmProcessDefinitions.find(i => i.id === req.query.id)
      else if (req.query.key)
        row = bpmProcessDefinitions
          .filter(i => i.key === req.query.key)
          .sort((a, b) => b.version - a.version)[0]
      if (!row)
        return fail('流程定义不存在')
      const { formConf, formFields } = resolveDefinitionForm(row)
      return ok({
        ...row,
        formConf: formConf || row.formConf,
        formFields: formFields?.length ? formFields : row.formFields,
      })
    },
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/process-definition/page',
    handler: (req) => {
      const pageNo = Number(req.query.pageNo || 1)
      const pageSize = Number(req.query.pageSize || 10)
      let list = [...bpmProcessDefinitions]
      const key = req.query.key?.trim()
      const name = req.query.name?.trim()
      if (key)
        list = list.filter(i => i.key === key)
      if (name)
        list = list.filter(i => String(i.name).includes(name))
      list.sort((a, b) => b.version - a.version)
      const enriched = list.map(enrichDefinitionRow)
      return bpmPageOk(paginate(enriched, pageNo, pageSize), enriched.length)
    },
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/process-definition/list',
    handler: (req) => {
      let list = [...bpmProcessDefinitions]
      const key = req.query.key?.trim()
      const suspensionState = req.query.suspensionState
      if (key)
        list = list.filter(i => i.key === key)
      if (suspensionState !== undefined && suspensionState !== '')
        list = list.filter(i => i.suspensionState === Number(suspensionState))
      list.sort((a, b) => b.version - a.version)
      return ok(list.map(enrichDefinitionRow))
    },
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/process-definition/simple-list',
    handler: () => {
      const latestByKey = new Map<string, any>()
      for (const row of bpmProcessDefinitions) {
        const prev = latestByKey.get(row.key)
        if (!prev || row.version > prev.version)
          latestByKey.set(row.key, row)
      }
      return ok(
        [...latestByKey.values()].map(i => ({
          id: i.id,
          key: i.key,
          name: i.name,
          version: i.version,
        })),
      )
    },
  },

  // —— 流程实例 ——
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/process-instance/manager-page',
    handler: (req) => {
      const pageNo = Number(req.query.pageNo || 1)
      const pageSize = Number(req.query.pageSize || 10)
      let list = filterProcessInstances(bpmProcessInstances, req.query)
      const startUserId = req.query.startUserId
      const processDefinitionId = req.query.processDefinitionId?.trim()
      if (startUserId !== undefined && startUserId !== '')
        list = list.filter(i => Number(i.startUser?.id) === Number(startUserId))
      if (processDefinitionId)
        list = list.filter(i => i.processDefinitionId === processDefinitionId)
      // 动态表单字段过滤
      try {
        const raw = req.query.formFieldsParams
        const params = typeof raw === 'string' && raw
          ? JSON.parse(raw)
          : (raw && typeof raw === 'object' ? raw : {})
        for (const [key, value] of Object.entries(params || {})) {
          if (value == null || String(value).trim() === '')
            continue
          list = list.filter(i => String(i.formVariables?.[key] ?? '').includes(String(value)))
        }
      }
      catch { /* ignore */ }
      return bpmPageOk(
        paginate(list, pageNo, pageSize).map(enrichProcessInstanceRow),
        list.length,
      )
    },
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/process-instance/my-page',
    handler: (req) => {
      const pageNo = Number(req.query.pageNo || 1)
      const pageSize = Number(req.query.pageSize || 10)
      let list = filterProcessInstances(bpmProcessInstances, req.query)
      // mock：当前用户发起的
      list = list.filter(i =>
        i.startUser?.id === mockCurrentUser.id
        || i.startUserNickname === mockCurrentUser.nickname,
      )
      return bpmPageOk(
        paginate(list, pageNo, pageSize).map(enrichProcessInstanceRow),
        list.length,
      )
    },
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/process-instance/get',
    handler: (req) => {
      const id = String(req.query.id || '')
      const row = bpmProcessInstances.find(i => i.id === id)
      if (!row)
        return fail('流程实例不存在')
      const def = findDefinition(row.processDefinitionId)
      return ok({
        ...row,
        processDefinition: def
          ? {
              id: def.id,
              key: def.key,
              name: def.name,
              version: def.version,
              modelType: def.modelType,
              formType: def.formType,
            }
          : undefined,
      })
    },
  },
  {
    method: 'POST',
    path: '/jgzf-flowable/bpm/process-instance/create',
    handler: (req) => {
      const body = req.body || {}
      const def = findDefinition(body.processDefinitionId) || findDefinition(body.processDefinitionKey)
      if (!def)
        return fail('流程定义不存在')
      const piId = createRuntimeInstance(def, body.variables || {})
      return ok(piId)
    },
  },
  {
    method: 'DELETE',
    path: '/jgzf-flowable/bpm/process-instance/cancel-by-start-user',
    handler: (req) => {
      const id = req.query.id ?? req.body?.id
      const reason = req.query.reason ?? req.body?.reason
      const row = bpmProcessInstances.find(i => i.id === id || i.id === String(id))
      if (!row)
        return fail('流程实例不存在')
      if (row.status !== 1)
        return fail('仅进行中的流程可取消')
      row.status = 4
      stampInstanceDuration(row)
      bpmTasks.filter(t => t.processInstanceId === row.id && !t.endTime).forEach((t) => {
        t.status = 4
        stampTaskDuration(t)
        t.reason = reason || '发起人取消'
      })
      const leave = bpmLeaves.find(l => l.processInstanceId === row.id)
      if (leave)
        leave.status = 4
      return ok(true)
    },
  },
  {
    method: 'DELETE',
    path: '/jgzf-flowable/bpm/process-instance/cancel-by-admin',
    handler: (req) => {
      const id = req.query.id ?? req.body?.id
      const reason = req.query.reason ?? req.body?.reason
      const row = bpmProcessInstances.find(i => i.id === id || i.id === String(id))
      if (!row)
        return fail('流程实例不存在')
      row.status = 4
      stampInstanceDuration(row)
      bpmTasks.filter(t => t.processInstanceId === row.id && !t.endTime).forEach((t) => {
        t.status = 4
        stampTaskDuration(t)
        t.reason = reason || '管理员取消'
      })
      const leave = bpmLeaves.find(l => l.processInstanceId === row.id)
      if (leave)
        leave.status = 4
      return ok(true)
    },
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/process-instance/copy/page',
    handler: (req) => {
      const pageNo = Number(req.query.pageNo || 1)
      const pageSize = Number(req.query.pageSize || 10)
      const name = String(req.query.processInstanceName || '').trim()
      let list = [...bpmProcessCopies]
      if (name)
        list = list.filter(i => String(i.processInstanceName || '').includes(name))
      return bpmPageOk(paginate(list, pageNo, pageSize), list.length)
    },
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/process-instance/get-approval-detail',
    handler: (req) => {
      const processInstanceId = String(req.query.processInstanceId || '')
      const processDefinitionId = String(req.query.processDefinitionId || '')
      const taskId = req.query.taskId ? String(req.query.taskId) : ''

      // 发起预测：仅有流程定义
      if (!processInstanceId && processDefinitionId) {
        const def = findDefinition(processDefinitionId)
        if (!def)
          return fail('流程定义不存在')
        const { formConf, formFields } = resolveDefinitionForm(def)
        const formFieldsPermission: Record<string, string> = {}
        const keys: string[] = []
        for (const raw of formFields) {
          try {
            const f = typeof raw === 'string' ? JSON.parse(raw) : raw
            const key = f.key || f.field
            if (key) {
              keys.push(key)
              formFieldsPermission[key] = '2'
            }
          }
          catch { /* ignore */ }
        }
        let approveNodeId = 'UserTask_1'
        let approveNodeName = '审批'
        if (def.modelType === 10) {
          approveNodeId = 'approveTask'
          approveNodeName = '财务审批'
        }
        else if (def.simpleModel) {
          try {
            const model = typeof def.simpleModel === 'string' ? JSON.parse(def.simpleModel) : def.simpleModel
            if (model?.childNode) {
              approveNodeId = model.childNode.id || approveNodeId
              approveNodeName = model.childNode.name || approveNodeName
            }
          }
          catch { /* ignore */ }
        }
        return ok({
          status: -1,
          processInstance: null,
          processDefinition: { ...def, formConf, formFields },
          activityNodes: [
            {
              id: 'StartUserNode',
              name: '发起人',
              nodeType: 10,
              status: -1,
              candidateUsers: [mockCurrentUser],
              tasks: [],
            },
            {
              id: approveNodeId,
              name: approveNodeName,
              nodeType: 11,
              candidateStrategy: 35, // START_USER_SELECT
              status: -1,
              candidateUsers: [],
              tasks: [],
            },
            {
              id: 'EndEvent',
              name: '结束',
              nodeType: 1,
              status: -1,
              candidateUsers: [],
              tasks: [],
            },
          ],
          todoTask: null,
          formFieldsPermission,
        })
      }

      const instance = bpmProcessInstances.find(i => i.id === processInstanceId)
      if (!instance)
        return fail('流程实例不存在')
      const def = findDefinition(instance.processDefinitionId)
      if (!def)
        return fail('流程定义不存在')
      const { formConf, formFields } = resolveDefinitionForm(def)
      const todoTask = taskId
        ? bpmTasks.find(t => t.id === taskId && !t.endTime)
        : bpmTasks.find(t => t.processInstanceId === processInstanceId && !t.endTime)

      const formFieldsPermission: Record<string, string> = {}
      const fieldKeys: string[] = []
      for (const raw of formFields) {
        try {
          const f = typeof raw === 'string' ? JSON.parse(raw) : raw
          const key = f.key || f.field
          if (key)
            fieldKeys.push(key)
        }
        catch { /* ignore */ }
      }
      fieldKeys.forEach((key, index) => {
        // 有待办时首个字段可编辑，其余只读；无待办全部只读
        formFieldsPermission[key] = todoTask
          ? (index === 0 ? '2' : '1')
          : '1'
      })

      return ok({
        status: instance.status,
        processInstance: { ...instance },
        processDefinition: {
          ...def,
          formConf,
          formFields,
        },
        activityNodes: buildActivityNodes(instance, def),
        todoTask: todoTask
          ? {
              ...enrichTaskForm(todoTask),
              signEnable: true,
              children: bpmTasks.filter(t => t.parentTaskId === todoTask.id && !t.endTime),
              buttonsSetting: [
                { id: 1, displayName: '通过', enable: true },
                { id: 2, displayName: '拒绝', enable: true },
                { id: 3, displayName: '转办', enable: true },
                { id: 4, displayName: '委派', enable: true },
                { id: 5, displayName: '加签', enable: true },
                { id: 6, displayName: '退回', enable: true },
                { id: 7, displayName: '抄送', enable: true },
              ],
            }
          : null,
        formFieldsPermission,
      })
    },
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/process-instance/get-next-approval-nodes',
    handler: (req) => {
      const processInstanceId = String(req.query.processInstanceId || '')
      const instance = bpmProcessInstances.find(i => i.id === processInstanceId)
      if (!instance)
        return ok([])
      // 模拟：下一节点需审批人自选
      return ok([
        {
          id: 'NextApproveUserSelect',
          name: '下一审批',
          nodeType: 11,
          candidateStrategy: 34, // APPROVE_USER_SELECT
          status: -1,
          candidateUsers: [],
          tasks: [],
        },
      ])
    },
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/process-instance/get-form-fields-permission',
    handler: (req) => {
      const processInstanceId = String(req.query.processInstanceId || '')
      const instance = bpmProcessInstances.find(i => i.id === processInstanceId)
      const def = findDefinition(instance?.processDefinitionId || String(req.query.processDefinitionId || ''))
      const hasTodo = processInstanceId
        ? bpmTasks.some(t => t.processInstanceId === processInstanceId && !t.endTime)
        : true
      return ok(buildFormFieldsPermission(def, hasTodo && instance?.status === 1))
    },
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/process-instance/get-bpmn-model-view',
    handler: (req) => {
      const id = String(req.query.id || '')
      const instance = bpmProcessInstances.find(i => i.id === id)
      if (!instance)
        return fail('流程实例不存在')
      const def = findDefinition(instance.processDefinitionId)
      const relatedTasks = bpmTasks.filter(t => t.processInstanceId === id)
      return ok({
        processInstance: instance,
        processDefinition: def,
        tasks: relatedTasks,
        bpmnXml: def?.bpmnXml || '',
        simpleModel: def?.simpleModel
          ? (typeof def.simpleModel === 'string' ? JSON.parse(def.simpleModel) : def.simpleModel)
          : null,
      })
    },
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/process-instance/get-print-data',
    handler: (req) => {
      const id = String(req.query.processInstanceId || '')
      const instance = bpmProcessInstances.find(i => i.id === id)
      if (!instance)
        return fail('流程实例不存在')
      const def = findDefinition(instance.processDefinitionId)
      const model = bpmModels.find(m => m.key === def?.key || m.id === def?.modelId)
      const printSetting = model?.printTemplateSetting || def?.printTemplateSetting
      const enabled = !!(printSetting?.enable)
      const template = printSetting?.template || ''
      const { formConf, formFields } = resolveDefinitionForm(def)
      const relatedTasks = bpmTasks.filter(t => t.processInstanceId === id)
      return ok({
        printTemplateEnable: enabled || !!template,
        printTemplateHtml: template,
        printTemplateContent: template,
        formFields,
        processInstance: {
          ...instance,
          processDefinition: {
            ...def,
            formConf,
            formFields,
          },
        },
        tasks: relatedTasks.map(t => ({
          id: t.id,
          name: t.name,
          description: [
            t.assigneeUserNickname || t.assigneeUser?.nickname || '',
            t.reason ? `意见：${t.reason}` : '',
            t.endTime ? `完成于 ${t.endTime}` : '处理中',
          ].filter(Boolean).join(' · '),
          signPicUrl: t.signPicUrl || '',
        })),
      })
    },
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/process-instance/comment/list',
    handler: (req) => {
      const processInstanceId = String(req.query.processInstanceId || '')
      const list = bpmProcessComments
        .filter(c => c.processInstanceId === processInstanceId)
        .sort((a, b) => String(a.createTime).localeCompare(String(b.createTime)))
      return ok(list)
    },
  },
  {
    method: 'POST',
    path: '/jgzf-flowable/bpm/process-instance/comment/create',
    handler: (req) => {
      const body = req.body || {}
      const processInstanceId = String(body.processInstanceId || '')
      const content = String(body.content || '').trim()
      if (!processInstanceId)
        return fail('缺少流程实例编号')
      if (!content)
        return fail('评论内容不能为空')
      const row = stampCreateTime({
        id: genBpmCommentId(),
        processInstanceId,
        userId: mockCurrentUser.id,
        userNickname: mockCurrentUser.nickname,
        content,
      })
      bpmProcessComments.push(row)
      return ok(row.id)
    },
  },

  // —— 流程任务 ——
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/task/todo-page',
    handler: (req) => {
      const pageNo = Number(req.query.pageNo || 1)
      const pageSize = Number(req.query.pageSize || 10)
      const list = filterTasks(bpmTasks.filter(i => !i.endTime), req.query)
      return bpmPageOk(
        paginate(list, pageNo, pageSize).map(enrichTaskRow),
        list.length,
      )
    },
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/task/done-page',
    handler: (req) => {
      const pageNo = Number(req.query.pageNo || 1)
      const pageSize = Number(req.query.pageSize || 10)
      const list = filterTasks(bpmTasks.filter(i => !!i.endTime), req.query)
      return bpmPageOk(
        paginate(list, pageNo, pageSize).map(enrichTaskRow),
        list.length,
      )
    },
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/task/manager-page',
    handler: (req) => {
      const pageNo = Number(req.query.pageNo || 1)
      const pageSize = Number(req.query.pageSize || 10)
      const list = filterTasks(bpmTasks, req.query)
      return bpmPageOk(
        paginate(list, pageNo, pageSize).map(enrichTaskRow),
        list.length,
      )
    },
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/task/list-by-process-instance-id',
    handler: (req) => {
      const processInstanceId = String(req.query.processInstanceId || '')
      return ok(bpmTasks.filter(t => t.processInstanceId === processInstanceId).map(enrichTaskForm))
    },
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/task/my-todo',
    handler: (req) => {
      const processInstanceId = String(req.query.processInstanceId || '')
      const task = bpmTasks.find(t => t.processInstanceId === processInstanceId && !t.endTime)
      return ok(task ? enrichTaskForm(task) : null)
    },
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/task/list-by-return',
    handler: (req) => {
      const id = String(req.query.id || req.query.taskId || '')
      const task = bpmTasks.find(t => t.id === id)
      if (!task)
        return ok([{ taskDefinitionKey: 'StartUserNode', name: '发起人' }])
      const instance = bpmProcessInstances.find(i => i.id === task.processInstanceId)
      const def = findDefinition(instance?.processDefinitionId)
      return ok(buildReturnCandidates(def, task.taskDefinitionKey))
    },
  },
  {
    method: 'PUT',
    path: '/jgzf-flowable/bpm/task/approve',
    handler: (req) => {
      const body = req.body || {}
      const task = bpmTasks.find(t => t.id === body.id)
      if (!task || task.endTime)
        return fail('待办任务不存在')
      task.status = 2
      stampTaskDuration(task)
      task.reason = body.reason || '同意'
      if (body.signPicUrl)
        task.signPicUrl = body.signPicUrl
      if (body.variables && typeof body.variables === 'object') {
        task.formVariables = {
          ...(task.formVariables || {}),
          ...body.variables,
        }
      }
      const instance = bpmProcessInstances.find(i => i.id === task.processInstanceId)
      if (!instance)
        return ok(true)

      if (body.variables && typeof body.variables === 'object') {
        instance.formVariables = {
          ...(instance.formVariables || {}),
          ...body.variables,
        }
      }

      const def = findDefinition(instance.processDefinitionId)
      const next = findNextUserTask(def, task.taskDefinitionKey)
      if (next) {
        // 多节点：推进到下一审批任务，实例保持进行中
        createNextTask(instance, def, next)
        return ok(true)
      }

      instance.status = 2
      stampInstanceDuration(instance)
      const leave = bpmLeaves.find(l => l.processInstanceId === task.processInstanceId)
      if (leave)
        leave.status = 2
      return ok(true)
    },
  },
  {
    method: 'PUT',
    path: '/jgzf-flowable/bpm/task/reject',
    handler: (req) => {
      const body = req.body || {}
      const task = bpmTasks.find(t => t.id === body.id)
      if (!task || task.endTime)
        return fail('待办任务不存在')
      task.status = 3
      stampTaskDuration(task)
      task.reason = body.reason || '拒绝'
      const instance = bpmProcessInstances.find(i => i.id === task.processInstanceId)
      if (instance) {
        instance.status = 3
        stampInstanceDuration(instance)
      }
      const leave = bpmLeaves.find(l => l.processInstanceId === task.processInstanceId)
      if (leave)
        leave.status = 3
      return ok(true)
    },
  },
  {
    method: 'PUT',
    path: '/jgzf-flowable/bpm/task/return',
    handler: (req) => {
      const body = req.body || {}
      const task = bpmTasks.find(t => t.id === body.id)
      if (!task || task.endTime)
        return fail('待办任务不存在')
      task.status = 5
      stampTaskDuration(task)
      task.reason = body.reason || '退回'
      return ok(true)
    },
  },
  {
    method: 'PUT',
    path: '/jgzf-flowable/bpm/task/delegate',
    handler: (req) => {
      const body = req.body || {}
      const task = bpmTasks.find(t => t.id === body.id)
      if (!task || task.endTime)
        return fail('待办任务不存在')
      task.assigneeUser = { id: body.delegateUserId, nickname: `用户${body.delegateUserId}` }
      task.assigneeUserNickname = task.assigneeUser.nickname
      task.reason = body.reason || '委派'
      return ok(true)
    },
  },
  {
    method: 'PUT',
    path: '/jgzf-flowable/bpm/task/transfer',
    handler: (req) => {
      const body = req.body || {}
      const task = bpmTasks.find(t => t.id === body.id)
      if (!task || task.endTime)
        return fail('待办任务不存在')
      task.assigneeUser = { id: body.assigneeUserId, nickname: `用户${body.assigneeUserId}` }
      task.assigneeUserNickname = task.assigneeUser.nickname
      task.reason = body.reason || '转办'
      return ok(true)
    },
  },
  {
    method: 'PUT',
    path: '/jgzf-flowable/bpm/task/create-sign',
    handler: (req) => {
      const body = req.body || {}
      const parent = bpmTasks.find(t => t.id === body.id)
      if (!parent || parent.endTime)
        return fail('待办任务不存在')
      const userIds: number[] = Array.isArray(body.userIds) ? body.userIds.map(Number) : []
      if (!userIds.length)
        return fail('请选择加签处理人')
      const type = body.type === 'after' ? 'after' : 'before'
      for (const uid of userIds) {
        const child = stampCreateTime({
          id: genBpmTaskId(),
          name: `${parent.name}-加签(${type === 'before' ? '前' : '后'})`,
          processInstanceId: parent.processInstanceId,
          processInstanceName: parent.processInstanceName,
          taskDefinitionKey: parent.taskDefinitionKey,
          parentTaskId: parent.id,
          signType: type,
          assigneeUser: { id: uid, nickname: `用户${uid}`, deptName: '示例部门' },
          assigneeUserNickname: `用户${uid}`,
          ownerUser: { id: uid, nickname: `用户${uid}`, deptName: '示例部门' },
          endTime: '',
          status: 1,
          reason: body.reason || '',
        })
        bpmTasks.unshift(child)
      }
      parent.reason = body.reason || parent.reason
      return ok(true)
    },
  },
  {
    method: 'DELETE',
    path: '/jgzf-flowable/bpm/task/delete-sign',
    handler: (req) => {
      const body = req.body || {}
      const id = String(body.id || req.query.id || '')
      const task = bpmTasks.find(t => t.id === id)
      if (!task)
        return fail('减签任务不存在')
      if (!task.parentTaskId)
        return fail('仅能减签加签产生的子任务')
      task.endTime = nowStr()
      task.status = 4
      task.reason = body.reason || '减签'
      return ok(true)
    },
  },
  {
    method: 'PUT',
    path: '/jgzf-flowable/bpm/task/copy',
    handler: (req) => {
      const body = req.body || {}
      const task = bpmTasks.find(t => t.id === body.id)
      const instance = task
        ? bpmProcessInstances.find(i => i.id === task.processInstanceId)
        : undefined
      const copyUserIds: number[] = Array.isArray(body.copyUserIds) ? body.copyUserIds.map(Number) : []
      const targets = copyUserIds.length ? copyUserIds : [0]
      for (const _uid of targets) {
        bpmProcessCopies.unshift(stampCreateTime({
          id: genBpmCopyId(),
          processInstanceId: instance?.id || '',
          processInstanceName: instance?.name || '',
          processInstanceStartTime: instance?.startTime || instance?.createTime || '',
          startUser: instance?.startUser,
          startUserNickname: instance?.startUserNickname || instance?.startUser?.nickname || '',
          activityId: task?.taskDefinitionKey || '',
          activityName: task?.name || '',
          createUser: mockCurrentUser,
          createUserNickname: mockCurrentUser.nickname,
          reason: body.reason || '抄送',
          summary: Object.entries(instance?.formVariables || {}).slice(0, 3).map(([key, value]) => ({
            key,
            value: String(value ?? ''),
          })),
        }))
      }
      return ok(true)
    },
  },
  {
    method: 'PUT',
    path: '/jgzf-flowable/bpm/task/withdraw',
    handler: (req) => {
      const taskId = String(req.query.taskId || req.body?.taskId || '')
      const task = bpmTasks.find(t => t.id === taskId)
      if (!task)
        return fail('任务不存在')
      if (!task.endTime)
        return fail('仅已办任务可撤回')
      task.endTime = ''
      task.status = 1
      task.reason = ''
      task.signPicUrl = ''
      const instance = bpmProcessInstances.find(i => i.id === task.processInstanceId)
      if (instance) {
        instance.status = 1
        instance.endTime = ''
      }
      return ok(true)
    },
  },
  {
    method: 'GET',
    path: '/jgzf-flowable/bpm/task/list-by-parent-task-id',
    handler: (req) => {
      const parentTaskId = String(req.query.parentTaskId || '')
      const list = bpmTasks.filter(t => t.parentTaskId === parentTaskId && !t.endTime)
      return ok(list)
    },
  },
]
