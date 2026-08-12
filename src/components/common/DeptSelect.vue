<script setup lang="ts">
import { SearchOutline } from '@vicons/ionicons5'
import { NIcon, NInput, NTree, NTreeSelect } from 'naive-ui'
import { deptToTreeSelectData, listDept } from '@/api/system/dept'

export type DeptTreeNode = ReturnType<typeof deptToTreeSelectData>[number]

const props = withDefaults(defineProps<{
  /** panel=左侧树；select=表单下拉 */
  mode?: 'panel' | 'select'
  title?: string
  placeholder?: string
  /** 仅加载启用部门 */
  onlyEnabled?: boolean
  clearable?: boolean
  filterable?: boolean
  disabled?: boolean
  multiple?: boolean
  checkable?: boolean
  /** 自定义数据；不传则自动拉取 */
  data?: DeptTreeNode[]
}>(), {
  mode: 'panel',
  title: '组织机构',
  placeholder: '请输入部门名称',
  onlyEnabled: true,
  clearable: true,
  filterable: true,
  disabled: false,
  multiple: false,
  checkable: false,
})

const emit = defineEmits<{
  change: [keys: number[], nodes: DeptTreeNode[]]
  loaded: [data: DeptTreeNode[]]
}>()

const selectedKeys = defineModel<number | number[] | null>('value', { default: null })

const filter = ref('')
const loading = ref(false)
const innerData = ref<DeptTreeNode[]>([])

const treeData = computed(() => props.data ?? innerData.value)

const selectedKeyList = computed<Array<string | number>>(() => {
  const v = selectedKeys.value
  if (v == null || v === ('' as unknown))
    return []
  return Array.isArray(v) ? v : [v]
})

async function loadDepts() {
  if (props.data)
    return
  loading.value = true
  try {
    const query = props.onlyEnabled ? { status: '1' } : {}
    const { data } = await listDept(query)
    innerData.value = deptToTreeSelectData(data ?? [])
    emit('loaded', innerData.value)
  }
  finally {
    loading.value = false
  }
}

function findNodes(nodes: DeptTreeNode[], keys: Array<string | number>): DeptTreeNode[] {
  const keySet = new Set(keys.map(String))
  const result: DeptTreeNode[] = []
  const walk = (list: DeptTreeNode[]) => {
    for (const node of list) {
      if (keySet.has(String(node.key)))
        result.push(node)
      if (node.children?.length)
        walk(node.children)
    }
  }
  walk(nodes)
  return result
}

function onSelect(keys: Array<string | number>) {
  const nums = keys.map(Number).filter(n => !Number.isNaN(n))
  if (props.multiple || props.checkable) {
    selectedKeys.value = nums
  }
  else {
    selectedKeys.value = nums[0] ?? null
  }
  emit('change', nums, findNodes(treeData.value, keys))
}

function onTreeSelectUpdate(value: string | number | Array<string | number> | null) {
  if (Array.isArray(value)) {
    const nums = value.map(Number)
    selectedKeys.value = nums
    emit('change', nums, findNodes(treeData.value, value))
    return
  }
  const num = value == null ? null : Number(value)
  selectedKeys.value = num
  emit('change', num == null ? [] : [num], num == null ? [] : findNodes(treeData.value, [num]))
}

onMounted(() => {
  loadDepts()
})

watch(() => props.data, (val) => {
  if (val)
    emit('loaded', val)
})

defineExpose({ reload: loadDepts, treeData })
</script>

<template>
  <!-- 左侧筛选面板 -->
  <aside v-if="mode === 'panel'" class="system-page__aside dept-select-panel">
    <div v-if="title" class="system-page__aside-title">{{ title }}</div>
    <NInput
      v-model:value="filter"
      clearable
      :placeholder="placeholder"
      size="small"
      class="system-page__aside-search"
    >
      <template #prefix>
        <NIcon size="14"><SearchOutline /></NIcon>
      </template>
    </NInput>
    <NTree
      block-line
      selectable
      :data="treeData"
      :pattern="filter"
      :selected-keys="selectedKeyList"
      :loading="loading"
      key-field="key"
      label-field="label"
      children-field="children"
      :show-irrelevant-nodes="false"
      :checkable="checkable"
      @update:selected-keys="onSelect"
    />
  </aside>

  <!-- 表单下拉 -->
  <NTreeSelect
    v-else
    :value="selectedKeys as any"
    :options="treeData as any"
    :placeholder="placeholder"
    :clearable="clearable"
    :filterable="filterable"
    :disabled="disabled"
    :multiple="multiple"
    :loading="loading"
    key-field="key"
    label-field="label"
    children-field="children"
    @update:value="onTreeSelectUpdate"
  />
</template>
