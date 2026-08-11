<script setup lang="ts">
import type { SysUser } from '@/api/system/types'
import { listUser, getUser } from '@/api/system/user'
import { NButton, NTag } from 'naive-ui'
import CommonModal from '@/components/common/modal/CommonModal.vue'
import SearchPanel from '@/components/common/SearchPanel.vue'
import CommonTable from '@/components/common/table/CommonTable.vue'
import { defineFields, extractSearchDefaults } from '@/utils/schema'
import { toPageResult } from '@/hooks/usePageList'

const statusOptions = [
  { label: '正常', value: '1' },
  { label: '停用', value: '0' },
]

type UserId = string | number

const props = withDefaults(defineProps<{
  disabled?: boolean
  readonly?: boolean
  multiple?: boolean
  placeholder?: string
}>(), {
  disabled: false,
  readonly: false,
  multiple: true,
  placeholder: '请选择用户',
})

const value = defineModel<UserId | UserId[] | null>('value', { default: null })

const show = ref(false)
const selectedUsers = ref<SysUser[]>([])
const checkedKeys = ref<UserId[]>([])

const searchFields = defineFields([
  {
    key: 'userName',
    label: '用户名称',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: { width: 120 },
  },
  {
    key: 'nickName',
    label: '用户昵称',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: { width: 120 },
  },
  {
    key: 'phonenumber',
    label: '手机号',
    component: 'NInput',
    search: false,
    form: false,
    table: { width: 120 },
  },
  {
    key: 'status',
    label: '状态',
    component: 'NSelect',
    options: statusOptions,
    search: false,
    form: false,
    table: {
      width: 80,
      format: 'option',
      tagType: val => (val === '1' ? 'success' : 'error'),
    },
  },
])

const {
  searchModel,
  tableData,
  total,
  loading,
  fetchList,
  handleSearch,
  onPageChange,
  onPageSizeChange,
} = usePageList({
  fetcher: async q => toPageResult(await listUser(q)),
  defaults: extractSearchDefaults(searchFields),
  immediate: false,
})

const interactive = computed(() => !props.disabled && !props.readonly)

const selectedIds = computed<UserId[]>(() => {
  if (value.value == null || value.value === '')
    return []
  return Array.isArray(value.value) ? value.value : [value.value]
})

function syncCheckedFromValue() {
  checkedKeys.value = [...selectedIds.value]
}

watch(checkedKeys, (keys) => {
  if (!props.multiple && keys.length > 1)
    checkedKeys.value = [keys[keys.length - 1]]
})

async function resolveUsersByIds(ids: UserId[]) {
  if (!ids.length) {
    selectedUsers.value = []
    return
  }

  const cached = new Map(selectedUsers.value.map(u => [String(u.userId), u]))
  const missing = ids.filter(id => !cached.has(String(id)))

  if (missing.length) {
    try {
      const res = await listUser({
        pageNum: 1,
        pageSize: Math.max(ids.length, 50),
        userIds: ids.join(','),
      })
      const rows = (res.data?.rows ?? []) as SysUser[]
      rows.forEach((u) => {
        cached.set(String(u.userId), u)
      })
    }
    catch {
      // ignore list fallback
    }

    await Promise.all(missing.map(async (id) => {
      if (cached.has(String(id)))
        return
      try {
        const res = await getUser(Number(id))
        if (res.data)
          cached.set(String(id), res.data as SysUser)
      }
      catch {
        cached.set(String(id), {
          userId: Number(id),
          userName: String(id),
          nickName: String(id),
          status: '1',
        })
      }
    }))
  }

  selectedUsers.value = ids
    .map(id => cached.get(String(id)))
    .filter(Boolean) as SysUser[]
}

watch(selectedIds, ids => resolveUsersByIds(ids), { immediate: true })

function openSelect() {
  if (!interactive.value)
    return
  syncCheckedFromValue()
  show.value = true
  fetchList()
}

function removeUser(userId: UserId) {
  if (!interactive.value)
    return
  if (props.multiple) {
    const next = selectedIds.value.filter(id => String(id) !== String(userId))
    value.value = next
  }
  else {
    value.value = null
  }
}

function handleConfirm() {
  const keys = checkedKeys.value
  if (props.multiple) {
    value.value = [...keys]
  }
  else {
    value.value = keys[0] ?? null
  }
  show.value = false
}

function displayName(user: SysUser) {
  return user.nickName || user.userName || String(user.userId)
}
</script>

<template>
  <div class="user-select" :class="{ 'user-select--disabled': !interactive }">
    <div class="user-select__tags">
      <NTag
        v-for="user in selectedUsers"
        :key="user.userId"
        :closable="interactive"
        size="small"
        @close="removeUser(user.userId)"
      >
        {{ displayName(user) }}
      </NTag>
      <span v-if="!selectedUsers.length" class="user-select__placeholder">
        {{ placeholder }}
      </span>
    </div>
    <NButton
      size="small"
      type="primary"
      secondary
      :disabled="!interactive"
      @click="openSelect"
    >
      选择
    </NButton>

    <CommonModal
      v-model:show="show"
      title="选择用户"
      :width="780"
      @confirm="handleConfirm"
    >
      <SearchPanel
        v-model:search-model="searchModel"
        :fields="searchFields"
        @search="handleSearch"
      />
      <CommonTable
        selectable
        col-setting-key="common-user-select"
        v-model:checked-row-keys="checkedKeys"
        :data="tableData as unknown as Record<string, unknown>[]"
        :fields="searchFields"
        :page="searchModel.pageNum as number"
        :page-size="searchModel.pageSize as number"
        :item-count="total"
        :row-key="(row: Record<string, unknown>) => row.userId as number"
        :table-props="{ loading, maxHeight: 360 }"
        @update:page="onPageChange"
        @update:page-size="onPageSizeChange"
      />
    </CommonModal>
  </div>
</template>

<style scoped lang="scss">
.user-select {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;

  &--disabled {
    opacity: 0.7;
  }

  &__tags {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    min-height: 28px;
    align-items: center;
  }

  &__placeholder {
    color: var(--n-placeholder-color, #c0c0c0);
    font-size: 13px;
  }
}
</style>
