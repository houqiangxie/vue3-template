<template>
  <n-form-item>
    <n-alert
      title="仅支持 POST 请求，以请求体方式接收参数"
      type="warning"
      show-icon
      :closable="false"
    />
  </n-form-item>
  <!-- 请求地址-->
  <n-form-item
    label-placement="top"
    label="请求地址"
    :path="`${formItemPrefix}.url`"
    :rules="{
      required: true,
      message: '请求地址不能为空',
      trigger: 'blur'
    }"
  >
    <n-input v-model:value="setting.url" />
  </n-form-item>
  <!-- 请求头，请求体设置-->
  <HttpRequestParamSetting :header="setting.header" :body="setting.body" :bind="formItemPrefix" />
  <!-- 返回值设置-->
  <div v-if="responseEnable">
    <n-form-item label="返回值" label-placement="top">
      <n-alert
        title="通过请求返回值, 可以修改流程表单的值"
        type="warning"
        show-icon
        :closable="false"
      />
    </n-form-item>
    <n-form-item>
      <div class="flex pt-4" v-for="(item, index) in setting.response" :key="index">
        <div class="mr-2">
          <n-form-item
            :path="`${formItemPrefix}.response.${index}.key`"
            :rules="{
              required: true,
              message: '表单字段不能为空',
              trigger: 'blur'
            }"
          >
            <n-select class="w-160px!" v-model:value="item.key" placeholder="请选择表单字段" :options="formFields.map(field => ({ label: field.title, value: field.field }))" />
          </n-form-item>
        </div>
        <div class="mr-2">
          <n-form-item
            :path="`${formItemPrefix}.response.${index}.value`"
            :rules="{
              required: true,
              message: '请求返回字段不能为空',
              trigger: 'blur'
            }"
          >
            <n-input class="w-160px" v-model:value="item.value" placeholder="请求返回字段" />
          </n-form-item>
        </div>
        <div class="mr-1 pt-1 cursor-pointer">
          <Icon
            icon="ep:delete"
            :size="18"
            @click="deleteHttpResponseSetting(setting.response!, index)"
          />
        </div>
      </div>
    </n-form-item>
    <div class="pt-1">
      <n-button type="primary" text @click="addHttpResponseSetting(setting.response!)">
        <Icon icon="ep:plus" class="mr-5px" />添加一行
      </n-button>
    </div>
  </div>
</template>
<script setup lang="ts">
import HttpRequestParamSetting from './HttpRequestParamSetting.vue'
import { useFormFields } from '../../node'

const props = defineProps({
  setting: {
    type: Object,
    required: true
  },
  responseEnable: {
    type: Boolean,
    required: true
  },
  formItemPrefix: {
    type: String,
    required: true
  }
})
const { setting } = toRefs(props)
const emits = defineEmits(['update:setting'])
watch(
  () => setting,
  (val) => {
    emits('update:setting', val)
  }
)

/** 流程表单字段 */
const formFields = useFormFields()

/** 添加 HTTP 请求返回值设置项 */
const addHttpResponseSetting = (responseSetting: Record<string, string>[]) => {
  responseSetting.push({
    key: '',
    value: ''
  })
}

/** 删除 HTTP 请求返回值设置项 */
const deleteHttpResponseSetting = (responseSetting: Record<string, string>[], index: number) => {
  responseSetting.splice(index, 1)
}
</script>

<style lang="scss" scoped></style>
