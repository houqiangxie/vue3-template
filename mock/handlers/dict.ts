import type { SysDictData, SysDictType } from '../../src/api/system/types'
import type { MockRoute } from '../utils'
import { fail, ok, pageOk } from '../utils'
import {
  dictDatas,
  dictTypes,
  genDictDataId,
  genDictTypeId,
  stampCreateTime,
} from '../data/store'

export const dictRoutes: MockRoute[] = [
  {
    method: 'GET',
    path: '/system/dict/type/list',
    handler: (req) => {
      const pageNum = Number(req.query.pageNum || 1)
      const pageSize = Number(req.query.pageSize || 10)
      let list = [...dictTypes]
      const dictName = req.query.dictName?.trim()
      const dictType = req.query.dictType?.trim()
      const status = req.query.status
      const beginTime = req.query.beginTime?.trim()
      const endTime = req.query.endTime?.trim()
      if (dictName)
        list = list.filter(d => d.dictName.includes(dictName))
      if (dictType)
        list = list.filter(d => d.dictType.includes(dictType))
      if (status !== undefined && status !== '')
        list = list.filter(d => d.status === status)
      if (beginTime)
        list = list.filter(d => (d.createTime || '') >= beginTime)
      if (endTime)
        list = list.filter(d => (d.createTime || '') <= `${endTime} 23:59:59`)
      const start = (pageNum - 1) * pageSize
      return pageOk(list.slice(start, start + pageSize), list.length)
    },
  },
  {
    method: 'GET',
    path: '/system/dict/type/:dictId',
    handler: (req) => {
      const dictId = Number(req.params.dictId)
      const row = dictTypes.find(d => d.dictId === dictId)
      if (!row)
        return fail('字典类型不存在')
      return ok({ ...row })
    },
  },
  {
    method: 'POST',
    path: '/system/dict/type',
    handler: (req) => {
      const body = req.body as Partial<SysDictType>
      if (!body.dictName || !body.dictType)
        return fail('字典名称和类型不能为空')
      if (dictTypes.some(d => d.dictType === body.dictType))
        return fail('字典类型已存在')
      const row = stampCreateTime({
        dictId: genDictTypeId(),
        dictName: body.dictName,
        dictType: body.dictType,
        status: body.status || '0',
        remark: body.remark,
      } as SysDictType)
      dictTypes.push(row)
      return ok(null)
    },
  },
  {
    method: 'PUT',
    path: '/system/dict/type',
    handler: (req) => {
      const body = req.body as Partial<SysDictType>
      const idx = dictTypes.findIndex(d => d.dictId === body.dictId)
      if (idx < 0)
        return fail('字典类型不存在')
      const oldType = dictTypes[idx].dictType
      dictTypes[idx] = { ...dictTypes[idx], ...body, dictId: dictTypes[idx].dictId }
      if (body.dictType && body.dictType !== oldType) {
        dictDatas.forEach((d) => {
          if (d.dictType === oldType)
            d.dictType = body.dictType!
        })
      }
      return ok(null)
    },
  },
  {
    method: 'DELETE',
    path: '/system/dict/type/:dictIds',
    handler: (req) => {
      const ids = req.params.dictIds.split(',').map(Number)
      const types = dictTypes.filter(d => ids.includes(d.dictId)).map(d => d.dictType)
      for (let i = dictTypes.length - 1; i >= 0; i--) {
        if (ids.includes(dictTypes[i].dictId))
          dictTypes.splice(i, 1)
      }
      for (let i = dictDatas.length - 1; i >= 0; i--) {
        if (types.includes(dictDatas[i].dictType))
          dictDatas.splice(i, 1)
      }
      return ok(null)
    },
  },
  {
    method: 'GET',
    path: '/system/dict/data/list',
    handler: (req) => {
      const pageNum = Number(req.query.pageNum || 1)
      const pageSize = Number(req.query.pageSize || 10)
      let list = [...dictDatas]
      const dictType = req.query.dictType?.trim()
      const dictLabel = req.query.dictLabel?.trim()
      const status = req.query.status
      if (dictType)
        list = list.filter(d => d.dictType === dictType)
      if (dictLabel)
        list = list.filter(d => d.dictLabel.includes(dictLabel))
      if (status !== undefined && status !== '')
        list = list.filter(d => d.status === status)
      list.sort((a, b) => a.dictSort - b.dictSort)
      const start = (pageNum - 1) * pageSize
      return pageOk(list.slice(start, start + pageSize), list.length)
    },
  },
  {
    method: 'GET',
    path: '/system/dict/data/type/:dictType',
    handler: (req) => {
      const dictType = req.params.dictType
      return ok(dictDatas.filter(d => d.dictType === dictType && d.status === '0').sort((a, b) => a.dictSort - b.dictSort))
    },
  },
  {
    method: 'POST',
    path: '/system/dict/data',
    handler: (req) => {
      const body = req.body as Partial<SysDictData>
      if (!body.dictLabel || !body.dictValue || !body.dictType)
        return fail('字典标签、键值和类型不能为空')
      const row = stampCreateTime({
        dictCode: genDictDataId(),
        dictSort: body.dictSort ?? 0,
        dictLabel: body.dictLabel,
        dictValue: body.dictValue,
        dictType: body.dictType,
        cssClass: body.cssClass,
        listClass: body.listClass || 'default',
        isDefault: body.isDefault || 'N',
        status: body.status || '0',
        remark: body.remark,
      } as SysDictData)
      dictDatas.push(row)
      return ok(null)
    },
  },
  {
    method: 'PUT',
    path: '/system/dict/data',
    handler: (req) => {
      const body = req.body as Partial<SysDictData>
      const idx = dictDatas.findIndex(d => d.dictCode === body.dictCode)
      if (idx < 0)
        return fail('字典数据不存在')
      dictDatas[idx] = { ...dictDatas[idx], ...body, dictCode: dictDatas[idx].dictCode }
      return ok(null)
    },
  },
  {
    method: 'DELETE',
    path: '/system/dict/data/:dictCodes',
    handler: (req) => {
      const ids = req.params.dictCodes.split(',').map(Number)
      for (let i = dictDatas.length - 1; i >= 0; i--) {
        if (ids.includes(dictDatas[i].dictCode))
          dictDatas.splice(i, 1)
      }
      return ok(null)
    },
  },
]
