<template>
  <n-drawer v-model:show="settingVisible"
   
    :width="550">
    <n-drawer-content :closable="false" native-scrollbar>
      <template #header>
      <div class="config-header">
        <input
          v-if="showInput"
          type="text"
          class="config-editable-input"
          @blur="blurEvent()"
          v-mountedFocus
          v-model="nodeName"
          :placeholder="nodeName"
        />
        <div v-else class="node-name">
          {{ nodeName }} <Icon class="ml-1" icon="ep:edit-pen" :size="16" @click="clickIcon()" />
        </div>
        <div class="divide-line"></div>
      </div>
    </template>
    
    <div>
      <n-form ref="formRef" :model="configForm" label-placement="top" :rules="formRules">
        <n-form-item label="延迟时间" path="delayType">
          <n-radio-group v-model:value="configForm.delayType">
            <n-radio-button
              v-for="item in DELAY_TYPE"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </n-radio-group>
        </n-form-item>
        <n-form-item v-if="configForm.delayType === DelayTypeEnum.FIXED_TIME_DURATION">
          <n-form-item path="timeDuration">
            <n-input-number
              class="mr-2"
              :style="{ width: '100px' }"
              v-model:value="configForm.timeDuration"
              :min="1"
              controls-position="right"
            />
          </n-form-item>
          <n-select v-model:value="configForm.timeUnit" class="mr-2" :style="{ width: '100px' }" :options="TIME_UNIT_TYPES" />
          <span>后进入下一节点</span>
        </n-form-item>
        <n-form-item v-if="configForm.delayType === DelayTypeEnum.FIXED_DATE_TIME" path="dateTime">
          <n-date-picker
            class="mr-2"
            v-model:value="configForm.dateTime"
            type="datetime"
            placeholder="请选择日期和时间"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
          <span>后进入下一节点</span>
        </n-form-item>
      </n-form>
    </div>
    
  
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
  NodeType,
  TIME_UNIT_TYPES,
  TimeUnitType,
  DelayTypeEnum,
  DELAY_TYPE
} from '../consts'
import { useWatchNode, useDrawer, useNodeName } from '../node'
import { convertTimeUnit } from '../utils'
defineOptions({
  name: 'DelayTimerNodeConfig'
})
const props = defineProps({
  flowNode: {
    type: Object as () => SimpleFlowNode,
    required: true
  }
})
// 抽屉配置
const { settingVisible, closeDrawer, openDrawer } = useDrawer()
// 当前节点
const currentNode = useWatchNode(props)
// 节点名称
const { nodeName, showInput, clickIcon, blurEvent } = useNodeName(NodeType.DELAY_TIMER_NODE)
// 抄送人表单配置
const formRef = ref() // 表单 Ref
// 表单校验规则
const formRules = reactive({
  delayType: [{ required: true, message: '延迟时间不能为空', trigger: 'change' }],
  timeDuration: [{ required: true, message: '延迟时间不能为空', trigger: 'change' }],
  dateTime: [{ required: true, message: '延迟时间不能为空', trigger: 'change' }]
})
// 配置表单数据
const configForm = ref({
  delayType: DelayTypeEnum.FIXED_TIME_DURATION,
  timeDuration: 1,
  timeUnit: TimeUnitType.HOUR,
  dateTime: ''
})
// 保存配置
const saveConfig = async () => {
  if (!formRef) return false
  const valid = await formRef.value.validate()
  if (!valid) return false
  const showText = getShowText()
  if (!showText) return false
  currentNode.value.name = nodeName.value!
  currentNode.value.showText = showText
  if (configForm.value.delayType === DelayTypeEnum.FIXED_TIME_DURATION) {
    currentNode.value.delaySetting = {
      delayType: configForm.value.delayType,
      delayTime: getIsoTimeDuration()
    }
  }
  if (configForm.value.delayType === DelayTypeEnum.FIXED_DATE_TIME) {
    currentNode.value.delaySetting = {
      delayType: configForm.value.delayType,
      delayTime: configForm.value.dateTime
    }
  }
  settingVisible.value = false
  return true
}
const getShowText = (): string => {
  let showText = ''
  if (configForm.value.delayType === DelayTypeEnum.FIXED_TIME_DURATION) {
    showText = `延迟${configForm.value.timeDuration}${TIME_UNIT_TYPES.find((item) => item.value === configForm.value.timeUnit).label}`
  }
  if (configForm.value.delayType === DelayTypeEnum.FIXED_DATE_TIME) {
    showText = `延迟至${configForm.value.dateTime.replace('T', ' ')}`
  }
  return showText
}
const getIsoTimeDuration = () => {
  let strTimeDuration = 'PT'
  if (configForm.value.timeUnit === TimeUnitType.MINUTE) {
    strTimeDuration += configForm.value.timeDuration + 'M'
  }
  if (configForm.value.timeUnit === TimeUnitType.HOUR) {
    strTimeDuration += configForm.value.timeDuration + 'H'
  }
  if (configForm.value.timeUnit === TimeUnitType.DAY) {
    strTimeDuration += configForm.value.timeDuration + 'D'
  }
  return strTimeDuration
}
// 显示延迟器节点配置， 由父组件传过来
const showDelayTimerNodeConfig = (node: SimpleFlowNode) => {
  nodeName.value = node.name
  if (node.delaySetting) {
    configForm.value.delayType = node.delaySetting.delayType
    // 固定时长
    if (configForm.value.delayType === DelayTypeEnum.FIXED_TIME_DURATION) {
      const strTimeDuration = node.delaySetting.delayTime
      let parseTime = strTimeDuration.slice(2, strTimeDuration.length - 1)
      let parseTimeUnit = strTimeDuration.slice(strTimeDuration.length - 1)
      configForm.value.timeDuration = parseInt(parseTime)
      configForm.value.timeUnit = convertTimeUnit(parseTimeUnit)
    }
    // 固定日期时间
    if (configForm.value.delayType === DelayTypeEnum.FIXED_DATE_TIME) {
      configForm.value.dateTime = node.delaySetting.delayTime
    }
  }
}

defineExpose({ openDrawer, showDelayTimerNodeConfig }) // 暴露方法给父组件
</script>

<style lang="scss" scoped></style>
