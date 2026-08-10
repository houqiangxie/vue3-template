import type { UsePageListOptions } from './usePageList'
import type { UseTreeListOptions } from './useTreeList'
import { useMessage } from 'naive-ui'
import { usePageList } from './usePageList'
import { useTreeList } from './useTreeList'
import { useFormModal } from './useFormModal'

interface UseCrudFormOptions {
  /** 表单默认值工厂 */
  formDefaults: () => Record<string, unknown>
}

/** 分页列表 CRUD（默认） */
export type UseCrudPageOptions<T extends Record<string, unknown> = Record<string, unknown>> =
  UsePageListOptions<T> & UseCrudFormOptions & {
    mode?: 'page'
  }

/** 树表 CRUD（Dept / Menu 等） */
export type UseCrudTreeOptions<T extends Record<string, unknown> = Record<string, unknown>> =
  UseTreeListOptions<T> & UseCrudFormOptions & {
    mode: 'tree'
  }

export type UseCrudOptions<T extends Record<string, unknown> = Record<string, unknown>> =
  | UseCrudPageOptions<T>
  | UseCrudTreeOptions<T>

export interface SubmitCreateOrUpdateOptions {
  payload?: Record<string, unknown>
  /** 在 fetchList 之前执行（如刷新树选项） */
  beforeFetch?: () => void | Promise<void>
}

// 业务 API 多为 Partial<SysXxx>，用宽松签名避免每页包装
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CrudApiFn = (payload: any) => Promise<unknown>

type SubmitCreateOrUpdate = (
  createApi: CrudApiFn,
  updateApi: CrudApiFn,
  options?: SubmitCreateOrUpdateOptions,
) => Promise<void>

type RemoveAndRefresh = (
  action: () => Promise<unknown>,
  successMessage?: string,
) => Promise<void>

/**
 * 标准 CRUD：列表（usePageList / useTreeList）+ useFormModal
 * - mode 省略或 'page' → 分页列表
 * - mode: 'tree' → 树表（无分页，客户端过滤）
 * 复杂页（左树 / 权限树 / 二次弹窗）可只用其中一半
 */
export function useCrud<T extends Record<string, unknown> = Record<string, unknown>>(
  options: UseCrudPageOptions<T>,
): ReturnType<typeof usePageList<T>> & ReturnType<typeof useFormModal> & {
  submitCreateOrUpdate: SubmitCreateOrUpdate
  removeAndRefresh: RemoveAndRefresh
}
export function useCrud<T extends Record<string, unknown> = Record<string, unknown>>(
  options: UseCrudTreeOptions<T>,
): ReturnType<typeof useTreeList<T>> & ReturnType<typeof useFormModal> & {
  submitCreateOrUpdate: SubmitCreateOrUpdate
  removeAndRefresh: RemoveAndRefresh
}
export function useCrud<T extends Record<string, unknown> = Record<string, unknown>>(
  options: UseCrudOptions<T>,
) {
  const { formDefaults, mode = 'page', ...listOptions } = options
  const message = useMessage()
  const list = mode === 'tree'
    ? useTreeList<T>(listOptions as UseTreeListOptions<T>)
    : usePageList<T>(listOptions as UsePageListOptions<T>)
  const form = useFormModal(formDefaults)

  async function submitCreateOrUpdate(
    createApi: CrudApiFn,
    updateApi: CrudApiFn,
    submitOptions?: SubmitCreateOrUpdateOptions,
  ) {
    await form.withSubmit(async () => {
      const body = submitOptions?.payload ?? form.formData.value
      if (form.isEdit.value)
        await updateApi(body)
      else
        await createApi(body)
      message.success(form.isEdit.value ? '修改成功' : '新增成功')
      await submitOptions?.beforeFetch?.()
      await list.fetchList()
    })
  }

  async function removeAndRefresh(
    action: () => Promise<unknown>,
    successMessage = '删除成功',
  ) {
    await action()
    message.success(successMessage)
    await list.fetchList()
  }

  return {
    ...list,
    ...form,
    submitCreateOrUpdate,
    removeAndRefresh,
  }
}
