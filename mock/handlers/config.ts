import type { SysConfig } from '../../src/api/system/types'
import type { MockRoute } from '../utils'
import { fail, ok, pageOk } from '../utils'
import { configs, genConfigId, stampCreateTime } from '../data/store'

export const configRoutes: MockRoute[] = [
  {
    method: 'GET',
    path: '/system/config/list',
    handler: (req) => {
      const pageNum = Number(req.query.pageNum || 1)
      const pageSize = Number(req.query.pageSize || 10)
      let list = [...configs]
      const configName = req.query.configName?.trim()
      const configKey = req.query.configKey?.trim()
      const configType = req.query.configType
      const beginTime = req.query.beginTime?.trim()
      const endTime = req.query.endTime?.trim()
      if (configName)
        list = list.filter(c => c.configName.includes(configName))
      if (configKey)
        list = list.filter(c => c.configKey.includes(configKey))
      if (configType !== undefined && configType !== '')
        list = list.filter(c => c.configType === configType)
      if (beginTime)
        list = list.filter(c => (c.createTime || '') >= beginTime)
      if (endTime)
        list = list.filter(c => (c.createTime || '') <= `${endTime} 23:59:59`)
      const start = (pageNum - 1) * pageSize
      return pageOk(list.slice(start, start + pageSize), list.length)
    },
  },
  {
    method: 'GET',
    path: '/system/config/configKey/:configKey',
    handler: (req) => {
      const row = configs.find(c => c.configKey === req.params.configKey)
      if (!row)
        return fail('参数不存在')
      return ok(row.configValue)
    },
  },
  {
    method: 'GET',
    path: '/system/config/:configId',
    handler: (req) => {
      const configId = Number(req.params.configId)
      const row = configs.find(c => c.configId === configId)
      if (!row)
        return fail('参数不存在')
      return ok({ ...row })
    },
  },
  {
    method: 'POST',
    path: '/system/config',
    handler: (req) => {
      const body = req.body as Partial<SysConfig>
      if (!body.configName || !body.configKey || body.configValue === undefined)
        return fail('参数名称、键名和键值不能为空')
      if (configs.some(c => c.configKey === body.configKey))
        return fail('参数键名已存在')
      const row = stampCreateTime({
        configId: genConfigId(),
        configName: body.configName,
        configKey: body.configKey,
        configValue: body.configValue,
        configType: body.configType || 'N',
        remark: body.remark,
      } as SysConfig)
      configs.push(row)
      return ok(null)
    },
  },
  {
    method: 'PUT',
    path: '/system/config',
    handler: (req) => {
      const body = req.body as Partial<SysConfig>
      const idx = configs.findIndex(c => c.configId === body.configId)
      if (idx < 0)
        return fail('参数不存在')
      if (body.configKey && configs.some(c => c.configKey === body.configKey && c.configId !== body.configId))
        return fail('参数键名已存在')
      configs[idx] = { ...configs[idx], ...body, configId: configs[idx].configId }
      return ok(null)
    },
  },
  {
    method: 'DELETE',
    path: '/system/config/refreshCache',
    handler: () => ok(null),
  },
  {
    method: 'DELETE',
    path: '/system/config/:configIds',
    handler: (req) => {
      const ids = req.params.configIds.split(',').map(Number)
      for (let i = configs.length - 1; i >= 0; i--) {
        if (ids.includes(configs[i].configId)) {
          if (configs[i].configType === 'Y')
            return fail(`内置参数「${configs[i].configKey}」不能删除`)
          configs.splice(i, 1)
        }
      }
      return ok(null)
    },
  },
]
