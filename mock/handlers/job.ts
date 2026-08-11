import type { SysJob } from '../../src/api/system/types'
import type { MockRoute } from '../utils'
import { fail, now, ok, pageOk } from '../utils'
import { genJobId, genJobLogId, jobLogs, jobs, stampCreateTime } from '../data/store'

export const jobRoutes: MockRoute[] = [
  {
    method: 'GET',
    path: '/schedule/job/list',
    handler: (req) => {
      const pageNum = Number(req.query.pageNum || 1)
      const pageSize = Number(req.query.pageSize || 10)
      let list = [...jobs]
      const jobName = req.query.jobName?.trim()
      const jobGroup = req.query.jobGroup
      const status = req.query.status
      if (jobName)
        list = list.filter(j => j.jobName.includes(jobName))
      if (jobGroup !== undefined && jobGroup !== '')
        list = list.filter(j => j.jobGroup === jobGroup)
      if (status !== undefined && status !== '')
        list = list.filter(j => j.status === status)
      const start = (pageNum - 1) * pageSize
      return pageOk(list.slice(start, start + pageSize), list.length)
    },
  },
  {
    method: 'GET',
    path: '/schedule/job/log/list',
    handler: (req) => {
      const pageNum = Number(req.query.pageNum || 1)
      const pageSize = Number(req.query.pageSize || 10)
      let list = [...jobLogs]
      const jobName = req.query.jobName?.trim()
      const jobGroup = req.query.jobGroup
      const status = req.query.status
      if (jobName)
        list = list.filter(l => l.jobName.includes(jobName))
      if (jobGroup !== undefined && jobGroup !== '')
        list = list.filter(l => l.jobGroup === jobGroup)
      if (status !== undefined && status !== '')
        list = list.filter(l => l.status === status)
      list.sort((a, b) => String(b.createTime).localeCompare(String(a.createTime)))
      const start = (pageNum - 1) * pageSize
      return pageOk(list.slice(start, start + pageSize), list.length)
    },
  },
  {
    method: 'DELETE',
    path: '/schedule/job/log/clean',
    handler: () => {
      jobLogs.splice(0, jobLogs.length)
      return ok(null)
    },
  },
  {
    method: 'PUT',
    path: '/schedule/job/changeStatus',
    handler: (req) => {
      const jobId = Number(req.body?.jobId)
      const status = req.body?.status as '0' | '1'
      const job = jobs.find(j => j.jobId === jobId)
      if (!job)
        return fail('任务不存在')
      job.status = status
      return ok(null)
    },
  },
  {
    method: 'PUT',
    path: '/schedule/job/run',
    handler: (req) => {
      const jobId = Number(req.body?.jobId)
      const job = jobs.find(j => j.jobId === jobId)
      if (!job)
        return fail('任务不存在')
      jobLogs.unshift({
        jobLogId: genJobLogId(),
        jobName: job.jobName,
        jobGroup: job.jobGroup,
        invokeTarget: job.invokeTarget,
        jobMessage: `${job.jobName} 手动执行成功，耗时：1毫秒`,
        status: '1',
        createTime: now(),
      })
      return ok(null)
    },
  },
  {
    method: 'GET',
    path: '/schedule/job/:jobId',
    handler: (req) => {
      const jobId = Number(req.params.jobId)
      const row = jobs.find(j => j.jobId === jobId)
      if (!row)
        return fail('任务不存在')
      return ok({ ...row })
    },
  },
  {
    method: 'POST',
    path: '/schedule/job',
    handler: (req) => {
      const body = req.body as Partial<SysJob>
      if (!body.jobName || !body.invokeTarget || !body.cronExpression)
        return fail('任务名称、调用目标和 cron 表达式不能为空')
      const row = stampCreateTime({
        jobId: genJobId(),
        jobName: body.jobName,
        jobGroup: body.jobGroup || 'DEFAULT',
        invokeTarget: body.invokeTarget,
        cronExpression: body.cronExpression,
        misfirePolicy: body.misfirePolicy || '1',
        concurrent: body.concurrent || '1',
        status: body.status || '1',
        remark: body.remark,
      } as SysJob)
      jobs.push(row)
      return ok(null)
    },
  },
  {
    method: 'PUT',
    path: '/schedule/job',
    handler: (req) => {
      const body = req.body as Partial<SysJob>
      const idx = jobs.findIndex(j => j.jobId === body.jobId)
      if (idx < 0)
        return fail('任务不存在')
      jobs[idx] = { ...jobs[idx], ...body, jobId: jobs[idx].jobId }
      return ok(null)
    },
  },
  {
    method: 'DELETE',
    path: '/schedule/job/:jobIds',
    handler: (req) => {
      const ids = req.params.jobIds.split(',').map(Number)
      for (let i = jobs.length - 1; i >= 0; i--) {
        if (ids.includes(jobs[i].jobId))
          jobs.splice(i, 1)
      }
      return ok(null)
    },
  },
]
