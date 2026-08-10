<template>
  <div class="system-page">
    <SearchPanel
      v-model:search-model="searchModel"
      :fields="searchFields"
      @search="handleSearch"
    >
      <template #default>
        <n-button v-if="hasPermission('system:role:add')" type="primary" @click="handleAdd">
          <template #icon>
            <n-icon size="14"><AddOutline /></n-icon>
          </template>
          新增
        </n-button>
        <n-button
          v-if="hasPermission('system:role:remove')"
          type="error"
          secondary
          :disabled="!checkedRoleIds.length"
          @click="handleBatchDelete"
        >
          删除
        </n-button>
      </template>
    </SearchPanel>

    <CommonTable
      class="system-page__table"
      flex-height
      selectable
      col-setting-key="system-role"
      v-model:checked-row-keys="checkedRoleIds"
      :filter-checked-keys="(keys) => keys.map(Number).filter(id => id !== 1)"
      :data="tableData"
      :fields="tableFields"
      :page="searchModel.pageNum as number"
      :page-size="searchModel.pageSize as number"
      :item-count="total"
      :row-key="(row: Record<string, unknown>) => row.roleId as number"
      :table-props="{ loading }"
      @update:page="onPageChange"
      @update:page-size="onPageSizeChange"
    />

    <!-- 新增/编辑 -->
    <CommonModal
      v-model:show="formVisible"
      v-model:form-model="formData"
      :config="formModalConfig"
      :loading="submitting"
      @confirm="handleSubmit"
    >
      <template #menuPerms>
        <div class="role-menu-block">
          <div class="role-menu-block__toolbar">
            <n-checkbox v-model:checked="menuExpand" @update:checked="toggleExpand">展开/折叠</n-checkbox>
            <n-checkbox v-model:checked="menuNodeAll" @update:checked="toggleCheckAll">全选/全不选</n-checkbox>
            <n-checkbox v-model:checked="menuCheckStrictly">父子联动</n-checkbox>
          </div>
          <n-tree
            block-line
            checkable
            :cascade="menuCheckStrictly"
            :data="menuTreeData"
            :checked-keys="checkedMenuKeys"
            :expanded-keys="expandedMenuKeys"
            key-field="key"
            label-field="label"
            children-field="children"
            style="max-height: 280px; overflow: auto"
            @update:checked-keys="onMenuChecked"
            @update:expanded-keys="expandedMenuKeys = $event as number[]"
          />
        </div>
      </template>
    </CommonModal>

    <!-- 单独分配菜单权限 -->
    <CommonModal
      v-model:show="menuVisible"
      title="分配菜单权限"
      :width="480"
      :loading="submitting"
      @confirm="handleAssignMenu"
    >
      <n-tree
        block-line
        cascade
        checkable
        :data="menuTreeData"
        :checked-keys="checkedMenuKeys"
        key-field="key"
        label-field="label"
        children-field="children"
        @update:checked-keys="checkedMenuKeys = $event as number[]"
      />
    </CommonModal>
  </div>
</template>

<script setup lang="tsx">
import { AddOutline } from '@vicons/ionicons5'
import { NSwitch } from 'naive-ui'
import { useRouter } from 'vue-router'
import SearchPanel from '@/components/common/SearchPanel.vue'
import CommonTable from '@/components/common/table/CommonTable.vue'
import CommonModal from '@/components/common/modal/CommonModal.vue'
import { defineFields, extractFormDefaults, extractSearchDefaults } from '@/components/common/table/fieldSchema'
import { defineModal } from '@/components/common/modal/modalSchema'
import { listMenu, menuToTreeSelectData } from '@/api/system/menu'
import {
  addRole,
  changeRoleStatus,
  deleteRole,
  getRole,
  listRole,
  updateRole,
  updateRoleMenu,
} from '@/api/system/role'
import type { SysRole } from '@/api/system/types'
import { statusOptions } from './constants'
import { usePermission } from '@/hooks/usePermission'

const router = useRouter()
const { message, confirmBatchDelete, confirmDanger } = useConfirm()
const { hasPermission } = usePermission()

const searchFields = defineFields([
  {
    key: 'roleName',
    label: '角色名称',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: false,
  },
  {
    key: 'roleKey',
    label: '权限字符',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: false,
  },
  {
    key: 'status',
    label: '状态',
    component: 'NSelect',
    options: statusOptions,
    search: { enabled: true, defaultValue: null },
    form: false,
    table: false,
  },
  {
    key: 'dateRange',
    label: '创建时间',
    component: 'NDatePicker',
    bind: {
      type: 'daterange',
      clearable: true,
      valueFormat: 'yyyy-MM-dd',
    },
    search: { enabled: true, span: 8, defaultValue: null },
    form: false,
    table: false,
  },
])

const roleFields = defineFields([
  {
    key: 'roleName',
    label: '角色名称',
    component: 'NInput',
    form: { required: true },
    search: false,
    table: { width: 140 },
  },
  {
    key: 'roleKey',
    label: '权限字符',
    component: 'NInput',
    form: { required: true },
    search: false,
    table: { width: 140 },
  },
  {
    key: 'roleSort',
    label: '显示顺序',
    component: 'NInputNumber',
    form: { required: true, defaultValue: 0 },
    search: false,
    table: { width: 100, align: 'center' },
  },
  {
    key: 'status',
    label: '状态',
    component: 'NRadioGroup',
    options: statusOptions,
    form: { required: true, defaultValue: '0' },
    search: false,
    table: {
      width: 90,
      render: (row: Record<string, unknown>) => {
        const role = row as unknown as SysRole
        if (role.roleId === 1)
          return statusOptions.find(o => o.value === role.status)?.label ?? ''
        return (
          <NSwitch
            value={role.status === '0'}
            rubberBand={false}
            onUpdateValue={(val: boolean) => handleStatusChange(role, val ? '0' : '1')}
          />
        )
      },
    },
  },
  {
    key: 'createTime',
    label: '创建时间',
    component: 'NInput',
    form: false,
    search: false,
    table: { width: 170 },
  },
  {
    key: 'remark',
    label: '备注',
    component: 'NInput',
    bind: { type: 'textarea', rows: 3 },
    form: { span: 2 },
    search: false,
    table: false,
  },
])

const tableFields = computed(() => [
  ...roleFields.filter(f => f.table !== false),
  {
    key: 'actions',
    label: '操作',
    form: false,
    search: false,
    table: {
      width: 280,
      fixed: 'right' as const,
      actions: () => [
        {
          key: 'edit',
          label: '修改',
          type: 'primary',
          permission: 'system:role:edit',
          onClick: (r) => handleEdit(r as unknown as SysRole),
        },
        {
          key: 'assignMenu',
          label: '权限',
          type: 'info',
          permission: 'system:role:edit',
          onClick: (r) => openAssignMenu(r as unknown as SysRole),
        },
        {
          key: 'assignUser',
          label: '分配用户',
          type: 'warning',
          permission: 'system:role:edit',
          onClick: (r) => openAssignUser(r as unknown as SysRole),
        },
        {
          key: 'delete',
          label: '删除',
          type: 'error',
          permission: 'system:role:remove',
          show: (r) => (r as unknown as SysRole).roleId !== 1,
          popconfirm: (r) => `是否确认删除角色「${(r as unknown as SysRole).roleName}」？`,
          onClick: async (r) => {
            await deleteRole([(r as unknown as SysRole).roleId])
            message.success('删除成功')
            await fetchList()
          },
        },
      ],
    },
  },
])

const checkedRoleIds = ref<Array<string | number>>([])

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
  fetcher: async q => toPageResult(await listRole(q)),
  defaults: extractSearchDefaults(searchFields),
  buildQuery: splitDateRange,
  immediate: false,
})

const {
  formVisible,
  formData,
  isEdit,
  submitting,
  openCreate,
  openEdit,
  withSubmit,
} = useFormModal(() => extractFormDefaults(roleFields))

const menuVisible = ref(false)
const currentRoleId = ref<number>()
const menuTreeData = ref<ReturnType<typeof menuToTreeSelectData>>([])
const checkedMenuKeys = ref<number[]>([])
const expandedMenuKeys = ref<number[]>([])
const menuExpand = ref(false)
const menuNodeAll = ref(false)
const menuCheckStrictly = ref(true)

const formModalConfig = computed(() => defineModal({
  title: isEdit.value ? '修改角色' : '新增角色',
  width: 640,
  sections: [
    {
      type: 'form',
      key: 'main',
      fields: roleFields,
      formProps: { cols: 2, labelWidth: 90 },
    },
    {
      type: 'slot',
      key: 'menuPerms',
      title: '菜单权限',
      slotName: 'menuPerms',
    },
  ],
}))

function collectMenuKeys(nodes: ReturnType<typeof menuToTreeSelectData>): number[] {
  const keys: number[] = []
  const walk = (list: typeof nodes) => {
    list.forEach((n) => {
      keys.push(n.key as number)
      if (n.children?.length)
        walk(n.children as typeof nodes)
    })
  }
  walk(nodes)
  return keys
}

onMounted(async () => {
  const { data: menus } = await listMenu()
  menuTreeData.value = menuToTreeSelectData(menus ?? [])
  await fetchList()
})

function resetMenuTreeState() {
  checkedMenuKeys.value = []
  expandedMenuKeys.value = []
  menuExpand.value = false
  menuNodeAll.value = false
  menuCheckStrictly.value = true
}

function handleAdd() {
  resetMenuTreeState()
  openCreate({ status: '0', roleSort: 0 })
}

async function handleEdit(row: SysRole) {
  resetMenuTreeState()
  const { data: role } = await getRole(row.roleId)
  checkedMenuKeys.value = role?.menuIds ?? []
  openEdit(row as unknown as Record<string, unknown>)
}

async function openAssignMenu(row: SysRole) {
  currentRoleId.value = row.roleId
  const { data: role } = await getRole(row.roleId)
  checkedMenuKeys.value = role?.menuIds ?? []
  menuVisible.value = true
}

function openAssignUser(row: SysRole) {
  router.push({
    name: 'System-AuthUser',
    query: { roleId: String(row.roleId) },
  })
}

function onMenuChecked(keys: Array<string | number>) {
  checkedMenuKeys.value = keys.map(Number)
}

function toggleExpand(expand: boolean) {
  expandedMenuKeys.value = expand ? collectMenuKeys(menuTreeData.value) : []
}

function toggleCheckAll(checkAll: boolean) {
  checkedMenuKeys.value = checkAll ? collectMenuKeys(menuTreeData.value) : []
}

function handleBatchDelete() {
  confirmBatchDelete({
    count: checkedRoleIds.value.length,
    label: '角色',
    action: () => deleteRole(checkedRoleIds.value as number[]),
    onDone: fetchList,
  })
}

function handleStatusChange(role: SysRole, status: '0' | '1') {
  const text = status === '0' ? '启用' : '停用'
  confirmDanger({
    title: '确认操作',
    content: `确认${text}角色「${role.roleName}」吗？`,
    successMessage: `${text}成功`,
    action: async () => {
      await changeRoleStatus(role.roleId, status)
      role.status = status
    },
  })
}

async function handleSubmit() {
  await withSubmit(async () => {
    const payload = {
      ...formData.value,
      menuIds: checkedMenuKeys.value,
    } as Partial<SysRole>
    if (isEdit.value)
      await updateRole(payload)
    else
      await addRole(payload)
    message.success(isEdit.value ? '修改成功' : '新增成功')
    await fetchList()
  })
}

async function handleAssignMenu() {
  submitting.value = true
  try {
    await updateRoleMenu(currentRoleId.value!, checkedMenuKeys.value)
    message.success('权限分配成功')
    menuVisible.value = false
  }
  finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.role-menu-block__toolbar {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}
</style>
