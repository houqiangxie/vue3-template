<template>
  <n-form ref="formRef" :model="condition" :rules="formRules" label-placement="top">
    <n-form-item label="配置方式" path="conditionType">
      <n-radio-group v-model:value="condition.conditionType" @change="changeConditionType">
        <n-radio
          v-for="(dict, indexConditionType) in conditionConfigTypes"
          :key="indexConditionType"
          :value="dict.value"
          :label="dict.value"
        >
          {{ dict.label }}
        </n-radio>
      </n-radio-group>
    </n-form-item>
    <n-form-item
      v-if="condition.conditionType === ConditionType.RULE && condition.conditionGroups"
      label="条件规则"
    >
      <div class="condition-group-tool">
        <div class="flex items-center">
          <div class="mr-4">条件组关系</div>
          <n-switch
            v-model:value="condition.conditionGroups.and"
            inline-prompt
          />
        </div>
      </div>
      <n-space direction="vertical" :spacer="condition.conditionGroups.and ? '且' : '或'">
        <n-card
          class="condition-group"
          style="width: 530px"
          v-for="(equation, cIdx) in condition.conditionGroups.conditions"
          :key="cIdx"
        >
          <div
            class="condition-group-delete"
            v-if="condition.conditionGroups.conditions.length > 1"
          >
            <Icon
              color="#0089ff"
              icon="ep:circle-close-filled"
              :size="18"
              @click="deleteConditionGroup(condition.conditionGroups.conditions, cIdx)"
            />
          </div>
          <template #header>
            <div class="flex items-center justify-between">
              <div>条件组</div>
              <div class="flex">
                <div class="mr-4">规则关系</div>
                <n-switch
                  v-model:value="equation.and"
                  inline-prompt
                />
              </div>
            </div>
          </template>

          <div class="flex pt-2" v-for="(rule, rIdx) in equation.rules" :key="rIdx">
            <div class="mr-2">
              <n-form-item
                :path="`conditionGroups.conditions.${cIdx}.rules.${rIdx}.leftSide`"
                :rules="{
                  required: true,
                  message: '左值不能为空',
                  trigger: 'change'
                }"
              >
                <n-select style="width: 160px" v-model:value="rule.leftSide" clearable :options="fieldOptions.map(field => ({ label: field.title, value: field.field }))" />
              </n-form-item>
            </div>
            <div class="mr-2">
              <n-select v-model:value="rule.opCode" style="width: 100px" :options="COMPARISON_OPERATORS" />
            </div>
            <div class="mr-2">
              <n-form-item
                :path="`conditionGroups.conditions.${cIdx}.rules.${rIdx}.rightSide`"
                :rules="{
                  required: true,
                  message: '右值不能为空',
                  trigger: 'blur'
                }"
              >
                <n-input v-model:value="rule.rightSide" style="width: 160px" />
              </n-form-item>
            </div>
            <div class="mr-1 flex items-center" v-if="equation.rules.length > 1">
              <Icon icon="ep:delete" :size="18" @click="deleteConditionRule(equation, rIdx)" />
            </div>
            <div class="flex items-center">
              <Icon icon="ep:plus" :size="18" @click="addConditionRule(equation, rIdx)" />
            </div>
          </div>
        </n-card>
      </n-space>
      <div title="添加条件组" class="mt-4 cursor-pointer">
        <Icon
          color="#0089ff"
          icon="ep:plus"
          :size="24"
          @click="addConditionGroup(condition.conditionGroups?.conditions)"
        />
      </div>
    </n-form-item>
    <n-form-item
      v-if="condition.conditionType === ConditionType.EXPRESSION"
      label="条件表达式"
      path="conditionExpression"
    >
      <n-input
        type="textarea"
        v-model:value="condition.conditionExpression"
        clearable
        style="width: 100%"
      />
    </n-form-item>
  </n-form>
</template>

<script setup lang="ts">
import {
  COMPARISON_OPERATORS,
  CONDITION_CONFIG_TYPES,
  ConditionType,
  DEFAULT_CONDITION_GROUP_VALUE
} from '../../consts'
import { BpmModelFormType } from '@/utils/constants'
import { useFormFieldsAndStartUser } from '../../node'
import { cloneDeep } from 'lodash-es'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})
const emit = defineEmits(['update:modelValue'])
const condition = computed({
  get() {
    return props.modelValue
  },
  set(newValue) {
    emit('update:modelValue', newValue)
  }
})
const formType = inject<Ref<number>>('formType') // 表单类型
const conditionConfigTypes = computed(() => {
  return CONDITION_CONFIG_TYPES.filter((item) => {
    // 业务表单暂时去掉条件规则选项
    if (formType?.value === BpmModelFormType.CUSTOM && item.value === ConditionType.RULE) {
      return false
    } else {
      return true
    }
  })
})

/** 条件规则可选择的表单字段 */
const fieldOptions = useFormFieldsAndStartUser()

// 表单校验规则
const formRules = reactive({
  conditionType: [{ required: true, message: '配置方式不能为空', trigger: 'blur' }],
  conditionExpression: [{ required: true, message: '条件表达式不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 切换条件配置方式 */
const changeConditionType = () => {
  if (condition.value.conditionType === ConditionType.RULE) {
    if (!condition.value.conditionGroups) {
      condition.value.conditionGroups = cloneDeep(DEFAULT_CONDITION_GROUP_VALUE)
    }
  }
}
const deleteConditionGroup = (conditions, index) => {
  conditions.splice(index, 1)
}

const deleteConditionRule = (condition, index) => {
  condition.rules.splice(index, 1)
}

const addConditionRule = (condition, index) => {
  const rule = {
    opCode: '==',
    leftSide: '',
    rightSide: ''
  }
  condition.rules.splice(index + 1, 0, rule)
}

const addConditionGroup = (conditions) => {
  const condition = {
    and: true,
    rules: [
      {
        opCode: '==',
        leftSide: '',
        rightSide: ''
      }
    ]
  }
  conditions.push(condition)
}

const validate = async () => {
  if (!formRef) return false
  return await formRef.value.validate()
}

defineExpose({ validate })
</script>

<style lang="scss" scoped>
.condition-group-tool {
  display: flex;
  justify-content: space-between;
  width: 500px;
  margin-bottom: 20px;
}

.condition-group {
  position: relative;

  &:hover {
    border-color: #0089ff;

    .condition-group-delete {
      opacity: 1;
    }
  }

  .condition-group-delete {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    cursor: pointer;
    opacity: 0;
  }
}

:deep(.el-card__header) {
  padding: 8px 16px;
  border-bottom: 1px solid #e5e7eb;
  box-sizing: border-box;
}
</style>
