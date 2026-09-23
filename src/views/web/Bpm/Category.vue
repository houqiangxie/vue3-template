<template>
  <div>
    <SearchPanel
      v-model:search-model="searchModel"
      :fields="categoryFields"
      @search="handleSearch"
    >
      <template #default>
        <n-space>
          <n-button
            v-if="hasPermission('bpm:category:update')"
            secondary
            @click="openSortModal"
          >
            调整排序
          </n-button>
          <n-button v-if="hasPermission('bpm:category:create')" type="primary" @click="handleAdd">
            <template #icon>
              <n-icon size="14"><AddOutline /></n-icon>
            </template>
            新增
          </n-button>
        </n-space>
      </template>
    </SearchPanel>

    <CommonTable
      class="page-container__table"
      flex-height
      show-index
      col-setting-key="bpm-category"
      :data="tableData"
      :fields="tableFields"
      :page="searchModel.pageNum as number"
      :page-size="searchModel.pageSize as number"
      :item-count="total"
      :row-key="(row: Record<string, unknown>) => row.id as number"
      :loading="loading"
      @update:page="onPageChange"
      @update:page-size="onPageSizeChange"
    />

    <CommonModal
      v-model:show="formVisible"
      v-model:form-model="formData"
      :config="formModalConfig"
      :loading="submitting"
      @confirm="handleSubmit"
    />

    <n-modal
      v-model:show="sortVisible"
      preset="card"
      title="调整分类排序"
      style="width: 420px"
      :bordered="false"
    >
      <p class="bpm-category-sort-hint">拖动调整顺序后保存（按列表顺序写回 sort）</p>
      <draggable
        v-model="sortList"
        item-key="id"
        handle=".bpm-category-sort__handle"
        animation="200"
        class="bpm-category-sort-list"
      >
        <template #item="{ element }">
          <div class="bpm-category-sort__item">
            <n-icon class="bpm-category-sort__handle" size="16">
              <MenuOutline />
            </n-icon>
            <span>{{ element.name }}</span>
            <span class="bpm-category-sort__code">{{ element.code }}</span>
          </div>
        </template>
      </draggable>
      <template #footer>
        <n-space justify="end">
          <n-button @click="sortVisible = false">取消</n-button>
          <n-button type="primary" :loading="sortSaving" @click="saveSort">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="tsx">
import { AddOutline, MenuOutline } from '@vicons/ionicons5'
import Draggable from 'vuedraggable'
import { CategoryApi, type CategoryVO } from '@/api/bpm/category'
import { usePermission } from '@/hooks/usePermission'
import { bpmStatusOptions, buildBpmPageQuery, toBpmPageResult } from './constants'

const { hasPermission } = usePermission()
const message = useMessage()

const sortVisible = ref(false)
const sortSaving = ref(false)
const sortList = ref<CategoryVO[]>([])

const categoryFields = defineFields([
  {
    key: 'name',
    label: '分类名',
    component: 'NInput',
    search: { enabled: true },
    form: { required: true },
    table: { minWidth: 140 },
  },
  {
    key: 'code',
    label: '分类标志',
    component: 'NInput',
    search: { enabled: true },
    form: { required: true },
    table: { minWidth: 120 },
  },
  {
    key: 'status',
    label: '状态',
    component: 'NSelect',
    options: bpmStatusOptions,
    form: { required: true, defaultValue: 0 },
    search: { enabled: true, defaultValue: null },
    table: {
      width: 90,
      format: 'option',
      tagType: val => (val === 0 ? 'success' : 'error'),
    },
  },
  {
    key: 'sort',
    label: '分类排序',
    component: 'NInputNumber',
    bind: { min: 0 },
    form: { required: true, defaultValue: 0 },
    search: false,
    table: { width: 100 },
  },
])

const {
  searchModel,
  tableData,
  total,
  loading,
  handleSearch,
  onPageChange,
  onPageSizeChange,
  formVisible,
  formData,
  isEdit,
  submitting,
  openCreate,
  openEdit,
  submitCreateOrUpdate,
  removeAndRefresh,
} = useCrud({
  fetcher: async query => toBpmPageResult(await CategoryApi.getCategoryPage(buildBpmPageQuery(query))),
  defaults: extractSearchDefaults(categoryFields),
  formDefaults: () => extractFormDefaults(categoryFields),
})

const tableFields = computed(() => [
  ...categoryFields,
  {
    key: 'actions',
    label: '操作',
    form: false,
    search: false,
    table: {
      width: 140,
      fixed: 'right' as const,
      actions: () => [
        {
          key: 'edit',
          label: '修改',
          type: 'primary',
          permission: 'bpm:category:update',
          onClick: (r) => openEdit(r as unknown as CategoryVO),
        },
        {
          key: 'delete',
          label: '删除',
          type: 'error',
          permission: 'bpm:category:delete',
          popconfirm: (r) => `是否确认删除分类「${(r as unknown as CategoryVO).name}」？`,
          onClick: async (r) => {
            await removeAndRefresh(() => CategoryApi.deleteCategory((r as unknown as CategoryVO).id))
          },
        },
      ],
    },
  },
])

const formModalConfig = computed(() => defineModal({
  title: isEdit.value ? '修改流程分类' : '新增流程分类',
  width: 520,
  sections: [{
    type: 'form',
    key: 'main',
    fields: categoryFields,
    formProps: { cols: 1, labelWidth: 90 },
  }],
}))

function handleAdd() {
  openCreate({ status: 0, sort: 0 })
}

async function openSortModal() {
  try {
    const list = await CategoryApi.getCategorySimpleList() as CategoryVO[]
    sortList.value = [...(list || [])].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    sortVisible.value = true
  }
  catch (e: any) {
    message.error(e?.message || '加载分类失败')
  }
}

async function saveSort() {
  sortSaving.value = true
  try {
    await CategoryApi.updateCategorySortBatch(sortList.value.map(i => i.id))
    message.success('排序已保存')
    sortVisible.value = false
    handleSearch()
  }
  catch (e: any) {
    message.error(e?.message || '排序失败')
  }
  finally {
    sortSaving.value = false
  }
}

async function handleSubmit() {
  await submitCreateOrUpdate(CategoryApi.createCategory, CategoryApi.updateCategory)
}
</script>

<style scoped>
.bpm-category-sort-hint {
  margin: 0 0 12px;
  color: #6b7280;
  font-size: 13px;
}
.bpm-category-sort-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 360px;
  overflow: auto;
}
.bpm-category-sort__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
}
.bpm-category-sort__handle {
  cursor: grab;
  color: #9ca3af;
}
.bpm-category-sort__code {
  margin-left: auto;
  color: #9ca3af;
  font-size: 12px;
}
</style>
