import request from '@/config/axios'

export type ProcessDefinitionVO = {
  id: string
  version: number
  deploymentTime?: string
  /** @deprecated 芋道历史拼写兼容 */
  deploymentTIme?: string
  suspensionState: number
  formType?: number
}

export type ModelVO = {
  id: number
  formName: string
  key: string
  name: string
  description: string
  category: string
  type?: number
  icon?: string
  formType: number
  formId: number
  formCustomCreatePath: string
  formCustomViewPath: string
  processDefinition: ProcessDefinitionVO
  status: number
  remark: string
  createTime: string
  bpmnXml: string
  simpleModel?: any
  visible?: boolean
  managerUserIds?: number[]
  startUserIds?: number[]
  startDeptIds?: number[]
  startUsers?: Array<{ id?: number, name?: string, nickname?: string }>
  startDepts?: Array<{ id?: number, name?: string, deptName?: string }>
  allowCancelRunningProcess?: boolean
  allowWithdrawTask?: boolean
}

export const getModelList = async (name: string | undefined) => {
  return await request.get({ url: '/jgzf-flowable/bpm/model/list', params: { name } })
}

export const getModel = async (id: string) => {
  return await request.get({ url: '/jgzf-flowable/bpm/model/get?id=' + id })
}

export const updateModel = async (data: ModelVO) => {
  return await request.put({ url: '/jgzf-flowable/bpm/model/update', data: data })
}

// 批量修改流程分类的排序
export const updateModelSortBatch = async (ids: number[]) => {
  return await request.put({
    url: `/jgzf-flowable/bpm/model/update-sort-batch`,
    params: {
      ids: ids.join(',')
    }
  })
}

export const updateModelBpmn = async (data: ModelVO) => {
  return await request.put({ url: '/jgzf-flowable/bpm/model/update-bpmn', data: data })
}

// 任务状态修改
export const updateModelState = async (id: number, state: number) => {
  const data = {
    id: id,
    state: state
  }
  return await request.put({ url: '/jgzf-flowable/bpm/model/update-state', data: data })
}

export const createModel = async (data: ModelVO) => {
  return await request.post({ url: '/jgzf-flowable/bpm/model/create', data: data })
}

export const deleteModel = async (id: number) => {
  return await request.delete({ url: '/jgzf-flowable/bpm/model/delete?id=' + id })
}

export const deployModel = async (id: number) => {
  return await request.post({ url: '/jgzf-flowable/bpm/model/deploy?id=' + id })
}

export const cleanModel = async (id: number) => {
  return await request.delete({ url: '/jgzf-flowable/bpm/model/clean?id=' + id })
}
