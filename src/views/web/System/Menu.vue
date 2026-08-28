<template>
  <div>
    <SearchPanel
      v-model:search-model="searchModel"
      :fields="menuSearchFields"
      @search="handleSearch"
    >
      <template #default>
        <n-button v-if="hasPermission('system:menu:add')" type="primary" @click="handleAdd()">
          <template #icon>
            <n-icon size="14"><AddOutline /></n-icon>
          </template>
          新增
        </n-button>
      </template>
    </SearchPanel>

    <CommonTable
      class="page-container__table"
      flex-height
      col-setting-key="system-menu"
      :data="tableData"
      :fields="tableFields"
      :show-pagination="false"
      :row-key="(row: Record<string, unknown>) => row.menuId as number"
      :loading="loading"
      :table-props="{ defaultExpandAll: true }"
    />

    <!-- 新增/编辑 -->
    <CommonModal
      v-model:show="formVisible"
      v-model:form-model="formData"
      :config="formModalConfig"
      :loading="submitting"
      @confirm="handleSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { AddOutline } from '@vicons/ionicons5'
import { useMessage } from 'naive-ui'
import { ApiError } from '@/utils/fetch'
import {
  addMenu,
  deleteMenu,
  listMenu,
  listMenuFlat,
  menuToTreeOptions,
  updateMenu,
} from '@/api/system/menu'
import type { SysMenu } from '@/api/system/types'
import {
  cacheOptions,
  menuTypeOptions,
  statusOptions,
  visibleOptions,
  yesNoOptions,
} from './constants'
import { usePermission } from '@/hooks/usePermission'

const message = useMessage()
const { hasPermission } = usePermission()

const parentMenuOptions = ref<{ label: string, key: number, children?: unknown[] }[]>([])

/** 非按钮类型（目录 / 菜单 / 页面级菜单） */
const isNotButton = (model: Record<string, unknown>) => model.menuType !== 'F'
/** 菜单或页面级菜单（可配置高亮、面包屑等） */
const isMenuOrPage = (model: Record<string, unknown>) =>
  model.menuType === 'C' || model.menuType === 'P'
/** 非目录（菜单 / 按钮 / 页面级菜单） */
const isNotDirectory = (model: Record<string, unknown>) => model.menuType !== 'M'

const menuSearchFields = defineFields([
  {
    key: 'menuName',
    label: '菜单名称',
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
])

const menuFormFields = computed(() => defineFields([
  {
    key: 'parentId',
    label: '上级菜单',
    component: 'NTreeSelect',
    options: [{ label: '主类目', key: 0 }, ...parentMenuOptions.value],
    form: { required: true, defaultValue: 0, span: 2 },
    search: false,
    table: false,
  },
  {
    key: 'menuType',
    label: '菜单类型',
    component: 'NRadioGroup',
    options: menuTypeOptions,
    form: { required: true, defaultValue: 'M', span: 2 },
    search: false,
    table: false,
  },
  {
    key: 'icon',
    label: '菜单图标',
    component: 'IconSelect',
    bind: { placeholder: '点击选择图标' },
    form: {
      span: 2,
      visible: isNotButton,
    },
    search: false,
    table: false,
  },
  {
    key: 'menuName',
    label: '菜单名称',
    component: 'NInput',
    bind: { placeholder: '请输入菜单名称' },
    form: { required: true },
    search: false,
    table: false,
  },
  {
    key: 'orderNum',
    label: '显示排序',
    component: 'NInputNumber',
    form: { required: true, defaultValue: 0 },
    search: false,
    table: false,
  },
  {
    key: 'routeName',
    label: '路由name',
    component: 'NInput',
    bind: { placeholder: '请输入路由name' },
    form: { visible: isNotButton },
    search: false,
    table: false,
  },
  {
    key: 'path',
    label: '路由地址',
    component: 'NInput',
    bind: { placeholder: '请输入路由地址' },
    form: {
      required: true,
      visible: isNotButton,
    },
    search: false,
    table: false,
  },
  {
    key: 'component',
    label: '组件路径',
    component: 'NInput',
    bind: { placeholder: '如 System/User；页签宿主填 TabView' },
    form: { visible: isNotButton },
    search: false,
    table: false,
  },
  {
    key: 'activeMenu',
    label: '高亮组件路径',
    component: 'NInput',
    bind: { placeholder: '请输入高亮组件路径' },
    form: { visible: isMenuOrPage },
    search: false,
    table: false,
  },
  {
    key: 'perms',
    label: '权限字符',
    component: 'NInput',
    bind: { placeholder: '请输入权限标识' },
    form: { visible: isNotDirectory },
    search: false,
    table: false,
  },
  {
    key: 'redirect',
    label: '重定向url',
    component: 'NInput',
    bind: { placeholder: '请输入' },
    form: { visible: isNotButton },
    search: false,
    table: false,
  },
  {
    key: 'breadcrumb',
    label: '面包屑显示',
    component: 'NRadioGroup',
    options: yesNoOptions,
    form: {
      defaultValue: '1',
      visible: isMenuOrPage,
    },
    search: false,
    table: false,
  },
  {
    key: 'isCache',
    label: '是否缓存',
    component: 'NRadioGroup',
    options: cacheOptions,
    form: {
      defaultValue: '1',
      visible: isNotButton,
    },
    search: false,
    table: false,
  },
  {
    key: 'visible',
    label: '显示状态',
    component: 'NRadioGroup',
    options: visibleOptions,
    form: {
      defaultValue: '1',
      // 页面级默认不进侧栏，但仍可改
      visible: isNotButton,
    },
    search: false,
    table: false,
  },
  {
    key: 'workbench',
    label: '显示工作台',
    component: 'NRadioGroup',
    options: visibleOptions,
    form: {
      defaultValue: '0',
      visible: (model) => model.menuType === 'C',
    },
    search: false,
    table: false,
  },
  {
    key: 'status',
    label: '菜单状态',
    component: 'NRadioGroup',
    options: statusOptions,
    form: { defaultValue: '1' },
    search: false,
    table: false,
  },
]))

const menuTableFields = defineFields([
  {
    key: 'menuName',
    label: '菜单名称',
    table: { width: 180, ellipsis: true },
    form: false,
    search: false,
  },
  {
    key: 'menuType',
    label: '类型',
    component: 'NSelect',
    options: menuTypeOptions,
    table: { width: 110, format: 'option' },
    form: false,
    search: false,
  },
  {
    key: 'icon',
    label: '图标',
    table: { width: 100 },
    form: false,
    search: false,
  },
  {
    key: 'orderNum',
    label: '排序',
    table: { width: 80, align: 'center' },
    form: false,
    search: false,
  },
  {
    key: 'perms',
    label: '权限字符',
    table: { width: 160, ellipsis: true },
    form: false,
    search: false,
  },
  {
    key: 'component',
    label: '组件路径',
    table: { width: 160, ellipsis: true },
    form: false,
    search: false,
  },
  {
    key: 'status',
    label: '状态',
    component: 'NSelect',
    options: statusOptions,
    table: {
      width: 90,
      format: 'option',
      tagType: val => (val === '1' ? 'success' : 'error'),
    },
    form: false,
    search: false,
  },
  {
    key: 'createTime',
    label: '创建时间',
    table: { width: 170 },
    form: false,
    search: false,
  },
])

const {
  searchModel,
  tableData,
  loading,
  fetchList,
  handleSearch,
  formVisible,
  formData,
  isEdit,
  submitting,
  openCreate,
  openEdit,
  submitCreateOrUpdate,
  removeAndRefresh,
} = useCrud({
  mode: 'tree',
  fetcher: async () => {
    const { data } = await listMenu()
    return (data ?? []) as unknown as Record<string, unknown>[]
  },
  defaults: extractSearchDefaults(menuSearchFields),
  filter: (data, model) => {
    let result = data as unknown as SysMenu[]
    if (model.menuName)
      result = filterTreeByKeyword(result as unknown as Record<string, unknown>[], String(model.menuName), 'menuName') as unknown as SysMenu[]
    if (model.status != null && model.status !== '')
      result = filterTreeByStatus(result as unknown as Record<string, unknown>[], String(model.status)) as unknown as SysMenu[]
    return result as unknown as Record<string, unknown>[]
  },
  formDefaults: () => extractFormDefaults(menuFormFields.value),
  immediate: false,
})

const tableFields = computed(() => [
  ...menuTableFields,
  {
    key: 'actions',
    label: '操作',
    form: false,
    search: false,
    table: {
      width: 200,
      fixed: 'right',
      actions: () => [
        {
          key: 'edit',
          label: '修改',
          type: 'primary',
          permission: 'system:menu:edit',
          onClick: (r) => handleEdit(r as unknown as SysMenu),
        },
        {
          key: 'add',
          label: '新增',
          type: 'info',
          permission: 'system:menu:add',
          onClick: (r) => handleAdd(r as unknown as SysMenu),
        },
        {
          key: 'delete',
          label: '删除',
          type: 'error',
          permission: 'system:menu:remove',
          popconfirm: (r) => `是否确认删除菜单「${(r as unknown as SysMenu).menuName}」？`,
          onClick: async (r) => {
            try {
              await removeAndRefresh(async () => {
                await deleteMenu((r as unknown as SysMenu).menuId)
                await refreshParentOptions()
              })
            }
            catch (e) {
              if (!(e instanceof ApiError && e.shown))
                message.error((e as Error).message)
            }
          },
        },
      ],
    },
  },
])

const formModalConfig = computed(() => defineModal({
  title: isEdit.value ? '修改菜单' : '新增菜单',
  width: 720,
  sections: [{
    type: 'form',
    key: 'main',
    fields: menuFormFields.value,
    formProps: { cols: 2, labelWidth: 110 },
  }],
}))

onMounted(async () => {
  await Promise.all([refreshParentOptions(), fetchList()])
})

async function refreshParentOptions() {
  const flat = await listMenuFlat()
  parentMenuOptions.value = menuToTreeOptions(flat)
}

function handleAdd(parent?: SysMenu) {
  const underTabView = parent?.component === 'TabView' || parent?.component === 'TabView/index'
  openCreate({
    parentId: parent?.menuId ?? 0,
    menuType: underTabView ? 'P' : (parent ? 'C' : 'M'),
    status: '1',
    visible: underTabView ? '0' : '1',
    isCache: '1',
    breadcrumb: '1',
    workbench: '0',
    orderNum: 0,
    ...(underTabView
      ? { activeMenu: parent?.routeName || parent?.path || '' }
      : {}),
  })
}

function handleEdit(row: SysMenu) {
  openEdit(row as unknown as Record<string, unknown>)
}

async function handleSubmit() {
  await submitCreateOrUpdate(addMenu, updateMenu, {
    beforeFetch: refreshParentOptions,
  })
}
</script>
