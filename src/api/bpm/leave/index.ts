import request from '@/config/axios'

export type LeaveVO = {
  id: number
  status: number
  type: number
  reason: string
  processInstanceId: string
  startTime: string
  endTime: string
  createTime: string
}

// 创建请假申请
export const createLeave = async (data: LeaveVO) => {
  return await request.post({ url: '/jgzf-flowable/bpm/oa/leave/create', data: data })
}

// 获得请假申请
export const getLeave = async (id: string) => {
  return await request.get({ url: '/jgzf-flowable/bpm/oa/leave/get?id=' + id })
}

// 获得请假申请分页
export const getLeavePage = async (params: Record<string, unknown>) => {
  return await request.get({ url: '/jgzf-flowable/bpm/oa/leave/page', params })
}
