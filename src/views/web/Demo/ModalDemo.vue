<template>
  <div class="modal-demo p-5">
    <n-card title="CommonModal 示例">
      <n-space>
        <n-button type="primary" @click="openEdit">
          编辑用户（form）
        </n-button>
        <n-button type="info" @click="openDetail">
          用户详情（form + table）
        </n-button>
        <n-button @click="openCustom">
          自定义内容（slot）
        </n-button>
      </n-space>

      <n-divider />

      <n-descriptions bordered :column="2" label-placement="left" title="当前表单数据">
        <n-descriptions-item label="姓名">
          {{ formData.name || '-' }}
        </n-descriptions-item>
        <n-descriptions-item label="手机号">
          {{ formData.phone || '-' }}
        </n-descriptions-item>
        <n-descriptions-item label="状态">
          {{ formData.status === 1 ? '启用' : formData.status === 0 ? '禁用' : '-' }}
        </n-descriptions-item>
        <n-descriptions-item label="备注">
          {{ formData.remark || '-' }}
        </n-descriptions-item>
      </n-descriptions>
    </n-card>

    <!-- 编辑弹窗：配置驱动 form -->
    <CommonModal
      v-model:show="editVisible"
      v-model:form-model="formData"
      :config="editUserModal"
      :loading="saving"
      @confirm="handleSave"
    />

    <!-- 详情弹窗：form + table -->
    <CommonModal
      v-model:show="detailVisible"
      v-model:form-model="formData"
      :config="userDetailModal"
      :table-data="{ logs: logList }"
    />

    <!-- 自定义插槽弹窗 -->
    <CommonModal
      v-model:show="customVisible"
      title="自定义内容"
      description="通过 default 插槽嵌入任意内容"
      :width="480"
      @confirm="customVisible = false"
    >
      <n-alert type="info" :bordered="false">
        这里是完全自定义的区域，可以嵌套任意组件或 HTML。
      </n-alert>
      <div class="mt-4 text-sm text-gray-500">
        当前姓名：{{ formData.name || '未填写' }}
      </div>
    </CommonModal>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

const statusOptions = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 },
]

const userPageFields = defineFields([
  {
    key: 'name',
    label: '姓名',
    component: 'NInput',
    form: { required: true },
    search: { enabled: true },
    table: { width: 120, ellipsis: true },
  },
  {
    key: 'phone',
    label: '手机号',
    component: 'NInput',
    bind: { patternType: 'phone' },
    form: { required: true },
    search: { enabled: true },
    table: { width: 140 },
  },
  {
    key: 'status',
    label: '状态',
    component: 'NSelect',
    options: statusOptions,
    form: { required: true, defaultValue: 1 },
    search: { enabled: true, defaultValue: null },
    table: {
      width: 100,
      format: 'option',
      tagType: val => (val === 1 ? 'success' : 'default'),
    },
  },
  {
    key: 'createTime',
    label: '创建时间',
    component: 'NDatePicker',
    form: false,
    search: false,
    table: { width: 180, format: 'datetime', sortable: true },
  },
  {
    key: 'remark',
    label: '备注',
    component: 'NInput',
    bind: { type: 'textarea' },
    form: { span: 2 },
    search: false,
    table: false,
  },
])

const editUserModal = defineModal({
  title: '编辑用户',
  description: '修改用户基本信息',
  width: 720,
  confirmText: '保存',
  cancelText: '取消',
  sections: [
    {
      type: 'form',
      key: 'main',
      fields: userPageFields,
      formProps: { cols: 2, labelWidth: 90 },
    },
  ],
})

const userDetailModal = defineModal({
  title: '用户详情',
  width: 900,
  showFooter: false,
  sections: [
    {
      type: 'form',
      key: 'main',
      title: '基本信息',
      fields: userPageFields,
      formProps: { cols: 2, disabled: true, disabledHideBorder: true },
    },
    {
      type: 'table',
      key: 'logs',
      title: '操作日志',
      fields: [
        {
          key: 'meta',
          label: '操作信息',
          children: [
            { key: 'action', label: '操作', table: { width: 120 } },
            { key: 'operator', label: '操作人', table: { width: 100 } },
          ],
        },
        { key: 'time', label: '时间', table: { width: 180, format: 'datetime' } },
      ],
      showPagination: false,
    },
  ],
  maskClosable:true
})

const message = useMessage()

const editVisible = ref(false)
const detailVisible = ref(false)
const customVisible = ref(false)
const saving = ref(false)

const formData = ref<Record<string, unknown>>({
  ...extractFormDefaults(userPageFields),
  name: '张三',
  phone: '13800138000',
  status: 1,
  remark: '这是一段备注',
})

const logList = ref([
  { action: '创建用户', operator: '管理员', time: Date.now() - 86400000 * 2 },
  { action: '修改信息', operator: '张三', time: Date.now() - 86400000 },
  { action: '启用账号', operator: '管理员', time: Date.now() },
])

function openEdit() {
  editVisible.value = true
}

function openDetail() {
  detailVisible.value = true
}

function openCustom() {
  customVisible.value = true
}

async function handleSave() {
  saving.value = true
  await new Promise(resolve => setTimeout(resolve, 600))
  saving.value = false
  editVisible.value = false
  message.success('保存成功')
  logList.value.unshift({
    action: '修改信息',
    operator: '张三',
    time: Date.now(),
  })
}
</script>

<style scoped>
.modal-demo {
  min-height: 100%;
  background: #f5f7fa;
}
</style>
