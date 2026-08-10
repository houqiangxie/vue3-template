import type { SysNotice } from '../../src/api/system/types'
import type { MockRoute } from '../utils'
import { fail, ok, pageOk } from '../utils'
import { genNoticeId, notices, stampCreateTime } from '../data/store'

export const noticeRoutes: MockRoute[] = [
  {
    method: 'GET',
    path: '/system/notice/list',
    handler: (req) => {
      const pageNum = Number(req.query.pageNum || 1)
      const pageSize = Number(req.query.pageSize || 10)
      let list = [...notices]
      const noticeTitle = req.query.noticeTitle?.trim()
      const noticeType = req.query.noticeType
      const status = req.query.status
      const createBy = req.query.createBy?.trim()
      if (noticeTitle)
        list = list.filter(n => n.noticeTitle.includes(noticeTitle))
      if (noticeType !== undefined && noticeType !== '')
        list = list.filter(n => n.noticeType === noticeType)
      if (status !== undefined && status !== '')
        list = list.filter(n => n.status === status)
      if (createBy)
        list = list.filter(n => (n.createBy || '').includes(createBy))
      const start = (pageNum - 1) * pageSize
      return pageOk(list.slice(start, start + pageSize), list.length)
    },
  },
  {
    method: 'GET',
    path: '/system/notice/:noticeId',
    handler: (req) => {
      const noticeId = Number(req.params.noticeId)
      const row = notices.find(n => n.noticeId === noticeId)
      if (!row)
        return fail('通知公告不存在')
      return ok({ ...row })
    },
  },
  {
    method: 'POST',
    path: '/system/notice',
    handler: (req) => {
      const body = req.body as Partial<SysNotice>
      if (!body.noticeTitle || !body.noticeType)
        return fail('公告标题和类型不能为空')
      const row = stampCreateTime({
        noticeId: genNoticeId(),
        noticeTitle: body.noticeTitle,
        noticeType: body.noticeType,
        noticeContent: body.noticeContent || '',
        status: body.status || '0',
        createBy: body.createBy || 'admin',
        remark: body.remark,
      } as SysNotice)
      notices.push(row)
      return ok(null)
    },
  },
  {
    method: 'PUT',
    path: '/system/notice',
    handler: (req) => {
      const body = req.body as Partial<SysNotice>
      const idx = notices.findIndex(n => n.noticeId === body.noticeId)
      if (idx < 0)
        return fail('通知公告不存在')
      notices[idx] = { ...notices[idx], ...body, noticeId: notices[idx].noticeId }
      return ok(null)
    },
  },
  {
    method: 'DELETE',
    path: '/system/notice/:noticeIds',
    handler: (req) => {
      const ids = req.params.noticeIds.split(',').map(Number)
      for (let i = notices.length - 1; i >= 0; i--) {
        if (ids.includes(notices[i].noticeId))
          notices.splice(i, 1)
      }
      return ok(null)
    },
  },
]
