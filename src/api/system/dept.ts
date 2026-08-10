import type { SysDept } from './types'
import { del, get, post, put } from '@/utils/fetch'

function flattenDeptTree(depts: SysDept[]): SysDept[] {
  return depts.flatMap((d) => {
    const { children, ...rest } = d
    return [rest as SysDept, ...(children?.length ? flattenDeptTree(children) : [])]
  })
}

function buildTree(list: SysDept[], parentId = 0): SysDept[] {
  return list
    .filter(d => d.parentId === parentId)
    .sort((a, b) => a.orderNum - b.orderNum)
    .map(d => ({
      ...d,
      children: buildTree(list, d.deptId),
    }))
    .map((d) => {
      if (!d.children?.length)
        delete d.children
      return d
    })
}

/** 部门列表（树形） */
export async function listDept(query: Record<string, unknown> = {}) {
  const res = await get<SysDept[]>('/system/dept/list', query)
  const data = res.data ?? []
  if (data.some(d => d.children?.length))
    return res
  return { ...res, data: buildTree(data) }
}

/** 部门列表（扁平） */
export async function listDeptFlat(query: Record<string, unknown> = {}) {
  const { data } = await listDept(query)
  return flattenDeptTree(data ?? [])
}

/** 部门详情 */
export function getDept(deptId: number) {
  return get<SysDept>(`/system/dept/${deptId}`)
}

/** 新增部门 */
export function addDept(data: Partial<SysDept>) {
  return post('/system/dept', data)
}

/** 修改部门 */
export function updateDept(data: Partial<SysDept>) {
  return put('/system/dept', data)
}

/** 删除部门 */
export function deleteDept(deptId: number) {
  return del(`/system/dept/${deptId}`)
}

/** 上级部门下拉�?*/
export function deptToTreeOptions(flatList: SysDept[], excludeId?: number) {
  function buildOptions(parentId: number) {
    return flatList
      .filter(d => d.parentId === parentId && d.deptId !== excludeId)
      .sort((a, b) => a.orderNum - b.orderNum)
      .map((dept) => {
        const children = buildOptions(dept.deptId)
        return {
          label: dept.deptName,
          key: dept.deptId,
          ...(children.length ? { children } : {}),
        }
      })
  }
  return buildOptions(0)
}

/** 部门下拉选项（扁平，�?NSelect 使用�?*/
export async function getDeptOptions() {
  const flat = await listDeptFlat({ status: '0' })
  return flat.map(d => ({ label: d.deptName, value: d.deptId }))
}

/** 排除子节点的部门树选项 */
export function deptToTreeSelectData(depts: SysDept[]) {
  return depts.map(d => ({
    key: d.deptId,
    label: d.deptName,
    children: d.children?.length ? deptToTreeSelectData(d.children) : undefined,
  }))
}
