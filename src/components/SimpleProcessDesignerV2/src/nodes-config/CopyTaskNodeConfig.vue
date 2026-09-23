<template>
  <n-drawer v-model:show="settingVisible" :width="550">
    <n-drawer-content :closable="false" native-scrollbar>
      <template #header>
      <div class="config-header">
        <input v-if="showInput" type="text" class="config-editable-input" @blur="blurEvent()" v-mountedFocus
          v-model="nodeName" :placeholder="nodeName" />
        <div v-else class="node-name">
          {{ nodeName }}
          <Icon class="ml-1" icon="ep:edit-pen" :size="16" @click="clickIcon()" />
        </div>
        <div class="divide-line"></div>
      </div>
    </template>
    
    <n-tabs type="border-card" v-model:value="activeTabName">
      <n-tab-pane tab="抄送人" name="user">
        <div>
          <n-form ref="formRef" :model="configForm" label-placement="top" :rules="formRules">
            <n-form-item label="抄送人设置" path="candidateStrategy">
              <n-radio-group v-model:value="configForm.candidateStrategy" @change="changeCandidateStrategy">
                <n-radio v-for="(dict, index) in copyUserStrategies" :key="index" :value="dict.value"
                  :label="dict.value">
                  {{ dict.label }}
                </n-radio>
              </n-radio-group>
            </n-form-item>

            <n-form-item v-if="configForm.candidateStrategy == CandidateStrategy.ROLE" label="指定角色" path="roleIds">
              <n-select v-model:value="configForm.roleIds" clearable multiple style="width: 100%" :options="roleOptions.map(item => ({ label: item.name, value: item.id }))" />
            </n-form-item>
            <n-form-item v-if="
              configForm.candidateStrategy == CandidateStrategy.DEPT_MEMBER ||
              configForm.candidateStrategy == CandidateStrategy.DEPT_LEADER ||
              configForm.candidateStrategy == CandidateStrategy.MULTI_LEVEL_DEPT_LEADER
            " label="指定部门" path="deptIds" span="24">
              <n-tree-select
                ref="treeRef"
                v-model:value="configForm.deptIds"
                :options="deptTreeOptions"
                key-field="key"
                label-field="label"
                children-field="children"
                multiple
                checkable
                :cascade="false"
                check-strategy="all"
                placeholder="请选择部门"
                style="width: 100%"
              />
            </n-form-item>
            <n-form-item v-if="configForm.candidateStrategy == CandidateStrategy.POST" label="指定岗位" path="postIds"
              span="24">
              <n-select v-model:value="configForm.postIds" clearable multiple style="width: 100%" :options="postOptions.map(item => ({ label: item.name, value: item.id! }))" />
            </n-form-item>
            <n-form-item v-if="configForm.candidateStrategy == CandidateStrategy.USER" label="指定用户" path="userIds"
              span="24">
              <n-select v-model:value="configForm.userIds" clearable multiple style="width: 100%" :options="userOptions.map(item => ({ label: item.nickname, value: item.id }))" />
            </n-form-item>
            <n-form-item v-if="configForm.candidateStrategy === CandidateStrategy.USER_GROUP" label="指定用户组"
              path="userGroups">
              <n-select v-model:value="configForm.userGroups" clearable multiple style="width: 100%" :options="userGroupOptions.map(item => ({ label: item.name, value: item.id }))" />
            </n-form-item>
            <n-form-item v-if="configForm.candidateStrategy === CandidateStrategy.FORM_USER" label="表单内用户字段"
              path="formUser">
              <n-select v-model:value="configForm.formUser" clearable style="width: 100%" :options="userFieldOnFormOptions.map(item => ({ label: item.title, value: item.field }))" />
            </n-form-item>
            <n-form-item v-if="configForm.candidateStrategy === CandidateStrategy.FORM_DEPT_LEADER" label="表单内部门字段"
              path="formDept">
              <n-select v-model:value="configForm.formDept" clearable style="width: 100%" :options="deptFieldOnFormOptions.map(item => ({ label: item.title, value: item.field }))" />
            </n-form-item>
            <n-form-item v-if="
              configForm.candidateStrategy == CandidateStrategy.MULTI_LEVEL_DEPT_LEADER ||
              configForm.candidateStrategy == CandidateStrategy.START_USER_DEPT_LEADER ||
              configForm.candidateStrategy ==
              CandidateStrategy.START_USER_MULTI_LEVEL_DEPT_LEADER ||
              configForm.candidateStrategy == CandidateStrategy.FORM_DEPT_LEADER
            " :label="deptLevelLabel!" path="deptLevel" span="24">
              <n-select v-model:value="configForm.deptLevel" clearable :options="MULTI_LEVEL_DEPT" />
            </n-form-item>
            <n-form-item v-if="configForm.candidateStrategy === CandidateStrategy.EXPRESSION" label="流程表达式"
              path="expression">
              <n-input type="textarea" v-model:value="configForm.expression" clearable style="width: 100%" />
            </n-form-item>
          </n-form>
        </div>
      </n-tab-pane>
      <n-tab-pane tab="表单字段权限" name="fields" v-if="formType === 10">
        <div class="field-setting-pane">
          <div class="field-setting-desc">字段权限</div>
          <div class="field-permit-title">
            <div class="setting-title-label first-title"> 字段名称 </div>
            <div class="other-titles">
              <span class="setting-title-label cursor-pointer" @click="updatePermission('READ')">
                只读
              </span>
              <span class="setting-title-label cursor-pointer" @click="updatePermission('WRITE')">
                可编辑
              </span>
              <span class="setting-title-label cursor-pointer" @click="updatePermission('NONE')">
                隐藏
              </span>
            </div>
          </div>
          <div class="field-setting-item" v-for="(item, index) in fieldsPermissionConfig" :key="index">
            <div class="field-setting-item-label"> {{ item.title }} </div>
            <n-radio-group class="field-setting-item-group" v-model:value="item.permission">
              <div class="item-radio-wrap">
                <n-radio :value="FieldPermissionType.READ" size="large"
                  :label="FieldPermissionType.WRITE"><span></span></n-radio>
              </div>
              <div class="item-radio-wrap">
                <n-radio :value="FieldPermissionType.WRITE" size="large" :label="FieldPermissionType.WRITE"
                  disabled><span></span></n-radio>
              </div>
              <div class="item-radio-wrap">
                <n-radio :value="FieldPermissionType.NONE" size="large"
                  :label="FieldPermissionType.NONE"><span></span></n-radio>
              </div>
            </n-radio-group>
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>
    
  
      <template #footer>
      <n-space justify="end">
        <n-button type="primary" @click="saveConfig">确 定</n-button>
        <n-button @click="closeDrawer">取 消</n-button>
      </n-space>
    </template>
    </n-drawer-content>
  </n-drawer>
</template>
<script setup lang="ts">
import {
  SimpleFlowNode,
  CandidateStrategy,
  NodeType,
  CANDIDATE_STRATEGY,
  FieldPermissionType,
  MULTI_LEVEL_DEPT
} from '../consts'
import {
  useWatchNode,
  useDrawer,
  useNodeName,
  useFormFieldsPermission,
  useNodeForm,
  CopyTaskFormType
} from '../node'
defineOptions({
  name: 'CopyTaskNodeConfig'
})
const props = defineProps({
  flowNode: {
    type: Object as () => SimpleFlowNode,
    required: true
  }
})
const deptLevelLabel = computed(() => {
  let label = '部门负责人来源'
  if (configForm.value.candidateStrategy == CandidateStrategy.MULTI_LEVEL_DEPT_LEADER) {
    label = label + '(指定部门向上)'
  } else {
    label = label + '(发起人部门向上)'
  }
  return label
})
// 抽屉配置
const { settingVisible, closeDrawer, openDrawer } = useDrawer()
// 当前节点
const currentNode = useWatchNode(props)
// 节点名称
const { nodeName, showInput, clickIcon, blurEvent } = useNodeName(NodeType.COPY_TASK_NODE)
// 激活的 Tab 标签页
const activeTabName = ref('user')
// 表单字段权限配置
const { formType, fieldsPermissionConfig, formFieldOptions, getNodeConfigFormFields } =
  useFormFieldsPermission(FieldPermissionType.READ)
// 表单内用户字段选项, 必须是必填和用户选择器
const userFieldOnFormOptions = computed(() => {
  return formFieldOptions.filter((item) => item.type === 'UserSelect')
})
// 表单内部门字段选项, 必须是必填和部门选择器
const deptFieldOnFormOptions = computed(() => {
  return formFieldOptions.filter((item) => item.type === 'DeptSelect')
})
// 抄送人表单配置
const formRef = ref() // 表单 Ref
// 表单校验规则
const formRules = reactive({
  candidateStrategy: [{ required: true, message: '抄送人设置不能为空', trigger: 'change' }],
  userIds: [{ required: true, message: '用户不能为空', trigger: 'change' }],
  roleIds: [{ required: true, message: '角色不能为空', trigger: 'change' }],
  deptIds: [{ required: true, message: '部门不能为空', trigger: 'change' }],
  userGroups: [{ required: true, message: '用户组不能为空', trigger: 'change' }],
  postIds: [{ required: true, message: '岗位不能为空', trigger: 'change' }],
  formUser: [{ required: true, message: '表单内用户字段不能为空', trigger: 'change' }],
  formDept: [{ required: true, message: '表单内部门字段不能为空', trigger: 'change' }],
  expression: [{ required: true, message: '流程表达式不能为空', trigger: 'blur' }]
})

const {
  configForm: tempConfigForm,
  roleOptions,
  postOptions,
  userOptions,
  userGroupOptions,
  deptTreeOptions,
  getShowText,
  handleCandidateParam,
  parseCandidateParam
} = useNodeForm(NodeType.COPY_TASK_NODE)
const configForm = tempConfigForm as Ref<CopyTaskFormType>
// 抄送人策略， 去掉发起人自选 和 发起人自己
const copyUserStrategies = computed(() => {
  return CANDIDATE_STRATEGY.filter((item) => item.value !== CandidateStrategy.START_USER)
})
// 改变抄送人设置策略
const changeCandidateStrategy = () => {
  configForm.value.userIds = []
  configForm.value.deptIds = []
  configForm.value.roleIds = []
  configForm.value.postIds = []
  configForm.value.userGroups = []
  configForm.value.deptLevel = 1
  configForm.value.formUser = ''
}
// 保存配置
const saveConfig = async () => {
  activeTabName.value = 'user'
  if (!formRef) return false
  const valid = await formRef.value.validate()
  if (!valid) return false
  const showText = getShowText()
  if (!showText) return false
  currentNode.value.name = nodeName.value!
  currentNode.value.candidateParam = handleCandidateParam()
  currentNode.value.candidateStrategy = configForm.value.candidateStrategy
  currentNode.value.showText = showText
  currentNode.value.fieldsPermission = fieldsPermissionConfig.value
  settingVisible.value = false
  return true
}
// 显示抄送节点配置， 由父组件传过来
const showCopyTaskNodeConfig = (node: SimpleFlowNode) => {
  nodeName.value = node.name
  // 抄送人设置
  configForm.value.candidateStrategy = node.candidateStrategy!
  parseCandidateParam(node.candidateStrategy!, node?.candidateParam)
  // 表单字段权限
  getNodeConfigFormFields(node.fieldsPermission)
}

/** 批量更新权限 */
const updatePermission = (type: string) => {
  fieldsPermissionConfig.value.forEach((field) => {
    field.permission =
      type === 'READ'
        ? FieldPermissionType.READ
        : type === 'WRITE'
          ? FieldPermissionType.WRITE
          : FieldPermissionType.NONE
  })
}

defineExpose({ openDrawer, showCopyTaskNodeConfig }) // 暴露方法给父组件
</script>

<style lang="scss" scoped></style>
