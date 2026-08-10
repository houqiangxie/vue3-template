import type { PageQuery, PageResult, SysDictData, SysDictType } from './types'
import { del, get, post, put } from '@/utils/fetch'

/** 字典类型分页 */
export function listDictType(query: PageQuery = {}) {
  return get<PageResult<SysDictType>>('/system/dict/type/list', query)
}

/** 字典类型详情 */
export function getDictType(dictId: number) {
  return get<SysDictType>(`/system/dict/type/${dictId}`)
}

/** 新增字典类型 */
export function addDictType(data: Partial<SysDictType>) {
  return post('/system/dict/type', data)
}

/** 修改字典类型 */
export function updateDictType(data: Partial<SysDictType>) {
  return put('/system/dict/type', data)
}

/** 删除字典类型 */
export function deleteDictType(dictIds: number[]) {
  return del(`/system/dict/type/${dictIds.join(',')}`)
}

/** 字典数据分页 */
export function listDictData(query: PageQuery = {}) {
  return get<PageResult<SysDictData>>('/system/dict/data/list', query)
}

/** 按类型查字典数据 */
export function getDicts(dictType: string) {
  return get<SysDictData[]>(`/system/dict/data/type/${dictType}`)
}

/** 新增字典数据 */
export function addDictData(data: Partial<SysDictData>) {
  return post('/system/dict/data', data)
}

/** 修改字典数据 */
export function updateDictData(data: Partial<SysDictData>) {
  return put('/system/dict/data', data)
}

/** 删除字典数据 */
export function deleteDictData(dictCodes: number[]) {
  return del(`/system/dict/data/${dictCodes.join(',')}`)
}
