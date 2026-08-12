import { getDicts } from '@/api/system/dict'
import type { SysDictData } from '@/api/system/types'

export interface DictOption {
  label: string
  value: string
  listClass?: string
  cssClass?: string
  raw?: SysDictData
}

const dictCache = new Map<string, DictOption[]>()
const pending = new Map<string, Promise<DictOption[]>>()

function toOptions(list: SysDictData[]): DictOption[] {
  return list
    .filter(item => item.status !== '0')
    .map(item => ({
      label: item.dictLabel,
      value: item.dictValue,
      listClass: item.listClass,
      cssClass: item.cssClass,
      raw: item,
    }))
}

/** 按字典类型拉取选项（带内存缓存） */
export async function fetchDictOptions(dictType: string): Promise<DictOption[]> {
  if (!dictType)
    return []
  const cached = dictCache.get(dictType)
  if (cached)
    return cached

  const inflight = pending.get(dictType)
  if (inflight)
    return inflight

  const task = getDicts(dictType)
    .then((res) => {
      const list = res.data ?? []
      const options = toOptions(Array.isArray(list) ? list : [])
      dictCache.set(dictType, options)
      return options
    })
    .finally(() => pending.delete(dictType))

  pending.set(dictType, task)
  return task
}

export function clearDictCache(dictType?: string) {
  if (dictType) {
    dictCache.delete(dictType)
    pending.delete(dictType)
    return
  }
  dictCache.clear()
  pending.clear()
}

/** 从已加载选项中取值对应标签（支持多值逗号分隔） */
export function selectDictLabel(
  options: DictOption[] | undefined | null,
  value: string | number | Array<string | number> | null | undefined,
  separator = ', ',
): string {
  if (value === null || value === undefined || value === '')
    return ''
  const values = Array.isArray(value)
    ? value.map(String)
    : String(value).split(',').map(v => v.trim()).filter(Boolean)
  if (!options?.length)
    return values.join(separator)
  return values
    .map(v => options.find(o => String(o.value) === v)?.label ?? v)
    .join(separator)
}

/**
 * 异步按字典类型解析标签。
 * @example const label = await getDictLabel('sys_user_sex', '0')
 */
export async function getDictLabel(
  dictType: string,
  value: string | number | Array<string | number> | null | undefined,
  separator = ', ',
): Promise<string> {
  const options = await fetchDictOptions(dictType)
  return selectDictLabel(options, value, separator)
}

/**
 * 按一个或多个字典类型加载选项。
 * @example const { sys_normal_disable } = useDict('sys_normal_disable')
 */
export function useDict(...dictTypes: string[]) {
  const result: Record<string, Ref<DictOption[]>> = {}

  for (const type of dictTypes)
    result[type] = ref<DictOption[]>(dictCache.get(type) ?? [])

  onMounted(async () => {
    await Promise.all(dictTypes.map(async (type) => {
      result[type].value = await fetchDictOptions(type)
    }))
  })

  return result
}

/**
 * 响应式字典标签：值变化时自动解析。
 * @example const sexLabel = useDictLabel('sys_user_sex', () => row.sex)
 */
export function useDictLabel(
  dictType: string,
  value: MaybeRefOrGetter<string | number | Array<string | number> | null | undefined>,
  separator = ', ',
) {
  const options = ref<DictOption[]>(dictCache.get(dictType) ?? [])
  const label = computed(() => selectDictLabel(options.value, toValue(value), separator))

  onMounted(async () => {
    options.value = await fetchDictOptions(dictType)
  })

  return label
}
