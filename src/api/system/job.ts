import type { PageQuery, PageResult, SysJob, SysJobLog } from './types'
import { del, get, post, put } from '@/utils/fetch'

/** 定时任务分页 */
export function listJob(query: PageQuery = {}) {
  return get<PageResult<SysJob>>('/schedule/job/list', query)
}

/** 定时任务详情 */
export function getJob(jobId: number) {
  return get<SysJob>(`/schedule/job/${jobId}`)
}

/** 新增定时任务 */
export function addJob(data: Partial<SysJob>) {
  return post('/schedule/job', data)
}

/** 修改定时任务 */
export function updateJob(data: Partial<SysJob>) {
  return put('/schedule/job', data)
}

/** 删除定时任务 */
export function deleteJob(jobIds: number[]) {
  return del(`/schedule/job/${jobIds.join(',')}`)
}

/** 修改任务状�?*/
export function changeJobStatus(jobId: number, status: '0' | '1') {
  return put('/schedule/job/changeStatus', { jobId, status })
}

/** 立即执行一�?*/
export function runJob(jobId: number, jobGroup: string) {
  return put('/schedule/job/run', { jobId, jobGroup })
}

/** 调度日志分页 */
export function listJobLog(query: PageQuery = {}) {
  return get<PageResult<SysJobLog>>('/schedule/job/log/list', query)
}

/** 清空调度日志 */
export function cleanJobLog() {
  return del('/schedule/job/log/clean')
}
