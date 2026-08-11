import type { SysPost } from '../../src/api/system/types'
import type { MockRoute } from '../utils'
import { fail, ok, pageOk } from '../utils'
import { genPostId, posts, stampCreateTime } from '../data/store'

export const postRoutes: MockRoute[] = [
  {
    method: 'GET',
    path: '/system/post/list',
    handler: (req) => {
      const pageNum = Number(req.query.pageNum || 1)
      const pageSize = Number(req.query.pageSize || 10)
      let list = [...posts]
      const postCode = req.query.postCode?.trim()
      const postName = req.query.postName?.trim()
      const status = req.query.status
      if (postCode)
        list = list.filter(p => p.postCode.includes(postCode))
      if (postName)
        list = list.filter(p => p.postName.includes(postName))
      if (status !== undefined && status !== '')
        list = list.filter(p => p.status === status)
      list.sort((a, b) => a.postSort - b.postSort)
      const start = (pageNum - 1) * pageSize
      return pageOk(list.slice(start, start + pageSize), list.length)
    },
  },
  {
    method: 'GET',
    path: '/system/post/:postId',
    handler: (req) => {
      const postId = Number(req.params.postId)
      const row = posts.find(p => p.postId === postId)
      if (!row)
        return fail('岗位不存在')
      return ok({ ...row })
    },
  },
  {
    method: 'POST',
    path: '/system/post',
    handler: (req) => {
      const body = req.body as Partial<SysPost>
      if (!body.postCode || !body.postName)
        return fail('岗位编码和名称不能为空')
      if (posts.some(p => p.postCode === body.postCode))
        return fail('岗位编码已存在')
      const row = stampCreateTime({
        postId: genPostId(),
        postCode: body.postCode,
        postName: body.postName,
        postSort: Number(body.postSort ?? 0),
        status: body.status || '1',
        remark: body.remark,
      } as SysPost)
      posts.push(row)
      return ok(null)
    },
  },
  {
    method: 'PUT',
    path: '/system/post',
    handler: (req) => {
      const body = req.body as Partial<SysPost>
      const idx = posts.findIndex(p => p.postId === body.postId)
      if (idx < 0)
        return fail('岗位不存在')
      if (body.postCode && posts.some(p => p.postCode === body.postCode && p.postId !== body.postId))
        return fail('岗位编码已存在')
      posts[idx] = { ...posts[idx], ...body, postId: posts[idx].postId }
      return ok(null)
    },
  },
  {
    method: 'DELETE',
    path: '/system/post/:postIds',
    handler: (req) => {
      const ids = req.params.postIds.split(',').map(Number)
      for (let i = posts.length - 1; i >= 0; i--) {
        if (ids.includes(posts[i].postId))
          posts.splice(i, 1)
      }
      return ok(null)
    },
  },
]
