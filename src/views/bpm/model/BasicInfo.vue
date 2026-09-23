<template>
  <n-form ref="formRef" :model="modelData" :rules="rules" label-width="120px" class="mt-20px">
    <n-form-item label="流程标识" path="key" class="mb-20px">
      <div class="flex items-center">
        <n-input
          class="!w-440px"
          v-model:value="modelData.key"
          :disabled="!!modelData.id"
          placeholder="请输入流程标识，以字母或下划线开头"
        />
        <n-tooltip trigger="hover" placement="top">
          <template #trigger>
            <Icon icon="ep:question-filled" class="ml-5px" />
          </template>
          {{ modelData.id ? '流程标识不可修改！' : '新建后，流程标识不可修改！' }}
        </n-tooltip>
      </div>
    </n-form-item>
    <n-form-item label="流程名称" path="name" class="mb-20px">
      <n-input
        v-model:value="modelData.name"
        clearable
        placeholder="请输入流程名称"
      />
    </n-form-item>
    <n-form-item label="流程分类" path="category" class="mb-20px">
      <n-select
        class="!w-full"
        v-model:value="modelData.category"
        clearable
        placeholder="请选择流程分类"
        :options="categoryOptions"
      />
    </n-form-item>
    <n-form-item label="流程图标" class="mb-20px">
      <UploadFile
        :value="iconFiles"
        :limit="1"
        file-type="img"
        :is-show-tip="false"
        @update:value="onIconChange"
      />
    </n-form-item>
    <n-form-item label="流程描述" path="description" class="mb-20px">
      <n-input v-model:value="modelData.description" clearable type="textarea" />
    </n-form-item>
    <n-form-item label="流程类型" path="type" class="mb-20px">
      <n-radio-group v-model:value="modelData.type">
        <n-radio
          v-for="dict in getIntDictOptions(DICT_TYPE.BPM_MODEL_TYPE)"
          :key="String(dict.value)"
          :value="dict.value"
        >
          {{ dict.label }}
        </n-radio>
      </n-radio-group>
    </n-form-item>
    <n-form-item label="是否可见" path="visible" class="mb-20px">
      <n-radio-group v-model:value="modelData.visible">
        <n-radio
          v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
          :key="String(dict.value)"
          :value="dict.value"
        >
          {{ dict.label }}
        </n-radio>
      </n-radio-group>
    </n-form-item>
    <n-form-item label="谁可以发起" path="startUserType" class="mb-20px">
      <n-select
        v-model:value="modelData.startUserType"
        placeholder="请选择谁可以发起"
        :options="startUserTypeOptions"
        @update:value="handleStartUserTypeChange"
      />
      <div v-if="modelData.startUserType === 1" class="mt-2 w-full">
        <UserSelect v-model:value="modelData.startUserIds" multiple placeholder="选择发起人" />
      </div>
      <div v-if="modelData.startUserType === 2" class="mt-2 w-full">
        <DeptSelect
          v-model:value="modelData.startDeptIds"
          mode="select"
          multiple
          placeholder="选择发起部门"
        />
      </div>
    </n-form-item>
    <n-form-item label="流程管理员" path="managerUserIds" class="mb-20px">
      <UserSelect v-model:value="modelData.managerUserIds" multiple placeholder="选择流程管理员" />
    </n-form-item>
  </n-form>
</template>

<script lang="ts" setup>
import type { FormInst, FormRules } from 'naive-ui'
import { DICT_TYPE, getBoolDictOptions, getIntDictOptions } from '@/utils/dict'
import type { UploadedFileItem } from '@/utils/file'
import { CategoryVO } from '@/api/bpm/category'
import UploadFile from '@/components/common/UploadFile.vue'
import UserSelect from '@/components/common/UserSelect.vue'
import DeptSelect from '@/components/common/DeptSelect.vue'
import { Icon } from '@/components/Icon'

const props = defineProps({
  categoryList: {
    type: Array as PropType<CategoryVO[]>,
    required: true
  },
  userList: {
    type: Array,
    required: true
  },
  deptList: {
    type: Array,
    required: true
  }
})

const formRef = ref<FormInst | null>(null)

const categoryOptions = computed(() =>
  props.categoryList.map((category) => ({
    label: category.name,
    value: category.code
  }))
)

const startUserTypeOptions = [
  { label: '全员', value: 0 },
  { label: '指定人员', value: 1 },
  { label: '指定部门', value: 2 }
]

const rules: FormRules = {
  name: [{ required: true, message: '流程名称不能为空', trigger: ['blur', 'input'] }],
  key: [
    { required: true, message: '流程标识不能为空', trigger: ['blur', 'input'] },
    {
      validator: (_rule, value: string) => {
        if (!value) return true
        if (!/^[a-zA-Z_][\-_.0-9_a-zA-Z$]*$/.test(value)) {
          return new Error('只能包含字母、数字、下划线、连字符和点号，且必须以字母或下划线开头')
        }
        return true
      },
      trigger: ['blur', 'input']
    }
  ],
  category: [{ required: true, message: '流程分类不能为空', trigger: ['blur', 'change'] }],
  type: [{ type: 'number', required: true, message: '流程类型不能为空', trigger: ['change'] }],
  visible: [{ type: 'boolean', required: true, message: '是否可见不能为空', trigger: ['change'] }],
  managerUserIds: [{ type: 'array', required: true, message: '流程管理员不能为空', trigger: ['change'] }]
}

const modelData = defineModel<any>()

const iconFiles = computed<UploadedFileItem[]>(() => {
  const icon = modelData.value?.icon
  if (!icon) return []
  if (typeof icon === 'string')
    return [{ url: icon, name: 'icon' }]
  return Array.isArray(icon) ? icon : [icon]
})

function onIconChange(files: UploadedFileItem[]) {
  const first = files?.[0]
  modelData.value.icon = first?.url || first?.fileUrl || first?.filePath || ''
}

const handleStartUserTypeChange = (value: number) => {
  if (value === 0) {
    modelData.value = {
      ...modelData.value,
      startUserIds: [],
      startDeptIds: []
    }
  } else if (value === 1) {
    modelData.value = {
      ...modelData.value,
      startDeptIds: []
    }
  } else if (value === 2) {
    modelData.value = {
      ...modelData.value,
      startUserIds: []
    }
  }
}

const validate = async () => {
  await formRef.value?.validate()
}

defineExpose({
  validate
})
</script>
