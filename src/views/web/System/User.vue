<template>
  <div class="page-container--split">
    <DeptSelect
      v-model:value="selectedDeptId"
      mode="panel"
      @change="onDeptChange"
    />

    <div class="page-container__main">
      <SearchPanel
        v-model:search-model="searchModel"
        :fields="searchFields"
        @search="handleSearch"
        @reset-form="handleResetSearch"
      >
        <template #default>
          <n-button v-hasPermi="'system:user:add'" type="primary" @click="handleAdd">
            <template #icon>
              <n-icon size="14"><AddOutline /></n-icon>
            </template>
            新增
          </n-button>
          <n-button
            v-hasPermi="'system:user:remove'"
            type="error"
            secondary
            :disabled="!checkedUserIds.length"
            @click="handleBatchDelete"
          >
            删除
          </n-button>
          <n-button v-hasPermi="'system:user:import'" secondary @click="importVisible = true">
            导入
          </n-button>
          <n-button
            v-hasPermi="'system:user:export'"
            secondary
            :loading="downloading"
            @click="handleExport"
          >
            导出
          </n-button>
        </template>
      </SearchPanel>

      <CommonTable
        class="page-container__table"
        flex-height
        selectable
        col-setting-key="system-user"
        v-model:checked-row-keys="checkedUserIds"
        :filter-checked-keys="(keys) => keys.map(Number).filter(id => id !== 1)"
        :data="tableData"
        :fields="tableFields"
        :page="searchModel.pageNum as number"
        :page-size="searchModel.pageSize as number"
        :item-count="total"
        :row-key="(row: Record<string, unknown>) => row.userId as number"
        :loading="loading"
        @update:page="onPageChange"
        @update:page-size="onPageSizeChange"
      />
    </div>

    <CommonModal
      v-model:show="formVisible"
      v-model:form-model="formData"
      :config="formModalConfig"
      :loading="submitting"
      @confirm="handleSubmit"
    />

    <CommonModal
      v-model:show="pwdVisible"
      v-model:form-model="pwdForm"
      :config="pwdModalConfig"
      :loading="submitting"
      @confirm="handleResetPwd"
    />

    <ExcelImportModal
      v-model:show="importVisible"
      title="用户导入"
      tip="仅允许导入 xls、xlsx 格式文件。"
      :on-download-template="handleDownloadTemplate"
      :on-import="handleImportUsers"
      @success="fetchList"
    />
  </div>
</template>

<script setup lang="tsx">
import { AddOutline } from '@vicons/ionicons5'
import { NSwitch } from 'naive-ui'
import {
  addUser,
  changeUserStatus,
  deleteUser,
  getUserPostOptions,
  getUserRoleOptions,
  importUser,
  listUser,
  resetUserPwd,
  updateUser,
} from '@/api/system/user'
import { deptToTreeSelectData, listDept } from '@/api/system/dept'
import type { SysUser } from '@/api/system/types'
import { sexOptions, statusOptions } from './constants'

const { message, confirmBatchDelete, confirmDanger } = useConfirm()
const { download, downloading } = useDownload()

const roleOptions = ref<{ label: string, value: number }[]>([])
const postOptions = ref<{ label: string, value: number }[]>([])
const deptTreeData = ref<ReturnType<typeof deptToTreeSelectData>>([])
const selectedDeptId = ref<number | null>(null)
const checkedUserIds = ref<Array<string | number>>([])
const pwdVisible = ref(false)
const importVisible = ref(false)
const currentUserId = ref<number>()
const pwdForm = ref({ password: '', confirmPassword: '' })

const searchFields = defineFields([
  {
    key: 'userName',
    label: '用户名称',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: false,
  },
  {
    key: 'phonenumber',
    label: '手机号码',
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

const {
  searchModel,
  tableData,
  total,
  loading,
  fetchList,
  handleSearch,
  handleReset,
  onPageChange,
  onPageSizeChange,
} = usePageList({
  fetcher: async q => toPageResult(await listUser(q)),
  defaults: {
    deptId: undefined as number | undefined,
    ...extractSearchDefaults(searchFields),
  },
  buildQuery: splitDateRange,
  immediate: false,
})

onMounted(async () => {
  roleOptions.value = await getUserRoleOptions()
  postOptions.value = await getUserPostOptions()
  const { data: depts } = await listDept({ status: '1' })
  deptTreeData.value = deptToTreeSelectData(depts ?? [])
  await fetchList()
})

const {
  formVisible,
  formData,
  isEdit,
  submitting,
  openCreate,
  openEdit,
  withSubmit,
} = useFormModal(() => extractFormDefaults(userFields.value))

const userFields = computed(() => defineFields([
  {
    key: 'nickName',
    label: '用户昵称',
    component: 'NInput',
    form: { required: true },
    search: false,
    table: { width: 120 },
  },
  {
    key: 'deptId',
    label: '归属部门',
    component: 'NTreeSelect',
    options: deptTreeData.value as any,
    bind: {
      keyField: 'key',
      labelField: 'label',
      childrenField: 'children',
      clearable: true,
      filterable: true,
    },
    form: { required: true },
    search: false,
    table: false,
  },
  {
    key: 'phonenumber',
    label: '手机号码',
    component: 'NInput',
    bind: { patternType: 'phone', maxlength: 11 },
    form: true,
    search: false,
    table: { width: 130 },
  },
  {
    key: 'email',
    label: '邮箱',
    component: 'NInput',
    form: true,
    search: false,
    table: { width: 160, ellipsis: { tooltip: true } },
  },
  {
    key: 'userName',
    label: '用户名称',
    component: 'NInput',
    form: {
      required: true,
      visible: () => !isEdit.value,
    },
    search: false,
    table: { width: 120 },
  },
  {
    key: 'password',
    label: '用户密码',
    component: 'NInput',
    bind: { type: 'password', showPasswordOn: 'click', maxlength: 20 },
    form: {
      required: true,
      visible: () => !isEdit.value,
    },
    search: false,
    table: false,
  },
  {
    key: 'sex',
    label: '用户性别',
    component: 'NSelect',
    options: sexOptions,
    form: { defaultValue: '0' },
    search: false,
    table: false,
  },
  {
    key: 'status',
    label: '状态',
    component: 'NRadioGroup',
    options: statusOptions,
    form: { required: true, defaultValue: '1' },
    search: false,
    table: {
      width: 90,
      render: (row: Record<string, unknown>) => {
        const user = row as unknown as SysUser
        if (user.userId === 1)
          return statusOptions.find(o => o.value === user.status)?.label ?? ''
        return (
          <NSwitch
            value={user.status === '1'}
            rubberBand={false}
            onUpdateValue={(val: boolean) => handleStatusChange(user, val ? '1' : '0')}
          />
        )
      },
    },
  },
  {
    key: 'deptName',
    label: '部门',
    component: 'NInput',
    form: false,
    search: false,
    table: { width: 120, ellipsis: { tooltip: true } },
  },
  {
    key: 'postIds',
    label: '岗位',
    component: 'NSelect',
    options: postOptions.value,
    bind: { multiple: true, maxTagCount: 'responsive' },
    form: { defaultValue: [] },
    search: false,
    table: false,
  },
  {
    key: 'roleIds',
    label: '角色',
    component: 'NSelect',
    options: roleOptions.value,
    bind: { multiple: true, maxTagCount: 'responsive' },
    form: { required: true, defaultValue: [] },
    search: false,
    table: false,
  },
  {
    key: 'roleNames',
    label: '角色',
    component: 'NInput',
    form: false,
    search: false,
    table: { width: 140, ellipsis: { tooltip: true } },
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
]))

const tableFields = computed(() => [
  ...userFields.value.filter(f => f.table !== false),
  {
    key: 'actions',
    label: '操作',
    form: false,
    search: false,
    table: {
      width: 220,
      fixed: 'right' as const,
      actions: () => [
        {
          key: 'edit',
          label: '修改',
          type: 'primary',
          permission: 'system:user:edit',
          show: (r) => (r as unknown as SysUser).userId !== 1,
          onClick: (r) => handleEdit(r as unknown as SysUser),
        },
        {
          key: 'resetPwd',
          label: '重置',
          type: 'warning',
          permission: 'system:user:resetPwd',
          show: (r) => (r as unknown as SysUser).userId !== 1,
          onClick: (r) => openResetPwd(r as unknown as SysUser),
        },
        {
          key: 'delete',
          label: '删除',
          type: 'error',
          permission: 'system:user:remove',
          show: (r) => (r as unknown as SysUser).userId !== 1,
          popconfirm: (r) => `是否确认删除用户「${(r as unknown as SysUser).userName}」？`,
          onClick: async (r) => {
            await deleteUser([(r as unknown as SysUser).userId])
            message.success('删除成功')
            await fetchList()
          },
        },
      ],
    },
  },
])

const formModalConfig = computed(() => defineModal({
  title: isEdit.value ? '修改用户' : '新增用户',
  width: 720,
  confirmText: '确定',
  sections: [{
    type: 'form',
    key: 'main',
    fields: userFields.value,
    formProps: { cols: 2, labelWidth: 90 },
  }],
}))

const pwdModalConfig = defineModal({
  title: '重置密码',
  width: 480,
  sections: [{
    type: 'form',
    key: 'main',
    fields: defineFields([
      {
        key: 'password',
        label: '新密码',
        component: 'NInput',
        bind: { type: 'password', showPasswordOn: 'click' },
        form: { required: true },
      },
      {
        key: 'confirmPassword',
        label: '确认密码',
        component: 'NInput',
        bind: { type: 'password', showPasswordOn: 'click' },
        form: { required: true },
      },
    ]),
    formProps: { cols: 1, labelWidth: 90 },
  }],
})

function handleResetSearch() {
  selectedDeptId.value = null
  handleReset({ deptId: undefined })
}

function onDeptChange(keys: number[]) {
  const id = keys[0]
  searchModel.value.deptId = id
  searchModel.value.pageNum = 1
  fetchList()
}

function handleAdd() {
  openCreate({
    status: '1',
    sex: '0',
    roleIds: [],
    postIds: [],
    password: '',
    deptId: searchModel.value.deptId,
  })
}

function handleEdit(row: SysUser) {
  openEdit(row as unknown as Record<string, unknown>, {
    postIds: row.postIds || [],
    roleIds: row.roleIds || [],
  })
}

function openResetPwd(row: SysUser) {
  currentUserId.value = row.userId
  pwdForm.value = { password: '', confirmPassword: '' }
  pwdVisible.value = true
}

function handleBatchDelete() {
  confirmBatchDelete({
    count: checkedUserIds.value.length,
    label: '用户',
    action: () => deleteUser(checkedUserIds.value as number[]),
    onDone: fetchList,
  })
}

function handleStatusChange(user: SysUser, status: '0' | '1') {
  const text = status === '1' ? '启用' : '停用'
  confirmDanger({
    title: '确认操作',
    content: `确认${text}用户「${user.userName}」吗？`,
    successMessage: `${text}成功`,
    action: async () => {
      await changeUserStatus(user.userId, status)
      user.status = status
    },
  })
}

async function handleSubmit() {
  await withSubmit(async () => {
    const payload = { ...formData.value } as Partial<SysUser>
    if (isEdit.value)
      await updateUser(payload)
    else
      await addUser(payload)
    message.success(isEdit.value ? '修改成功' : '新增成功')
    await fetchList()
  })
}

async function handleResetPwd() {
  if (pwdForm.value.password !== pwdForm.value.confirmPassword) {
    message.error('两次输入的密码不一致')
    return
  }
  submitting.value = true
  try {
    await resetUserPwd(currentUserId.value!, pwdForm.value.password)
    message.success('密码重置成功')
    pwdVisible.value = false
  }
  finally {
    submitting.value = false
  }
}

async function handleDownloadTemplate() {
  await download('/system/user/importTemplate', { filename: 'user_template.xlsx' })
}

async function handleImportUsers(file: File) {
  await importUser(file)
}

async function handleExport() {
  await download('/system/user/export', {
    params: { ...searchModel.value } as Record<string, unknown>,
    filename: `user_${Date.now()}.xlsx`,
  })
}
</script>
