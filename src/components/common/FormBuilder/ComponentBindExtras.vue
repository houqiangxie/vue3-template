<script setup lang="ts">
import type { FieldBind } from '@/components/common/table/fieldSchema'
import type { NaiveComponentName } from '@/components/common/table/fieldSchema'
import {
  datePickerTypeOptions,
  dynamicInputPresetOptions,
  timePickerFormatOptions,
} from './constants'
import { formatLooseValue, parseLooseValue } from './utils'

const props = defineProps<{
  component: NaiveComponentName | string | undefined
  bind: FieldBind | undefined
}>()

const emit = defineEmits<{
  update: [key: string, value: unknown]
}>()

function upd(key: string, value: unknown) {
  emit('update', key, value)
}

const comp = computed(() => String(props.component || 'NInput'))

const colorModeOptions = [
  { label: 'hex', value: 'hex' },
  { label: 'rgb', value: 'rgb' },
  { label: 'hsl', value: 'hsl' },
  { label: 'hsv', value: 'hsv' },
]
</script>

<template>
  <template v-if="comp === 'NInput' && bind?.type !== 'textarea'">
    <template v-if="bind?.type !== 'password'">
      <n-form-item label="最大长度">
        <n-input-number
          :value="bind?.maxlength as number | undefined"
          :min="1"
          clearable
          @update:value="v => upd('maxlength', v)"
        />
      </n-form-item>
      <n-form-item label="显示计数">
        <n-switch
          :value="!!bind?.showCount"
          @update:value="v => upd('showCount', v || undefined)"
        />
      </n-form-item>
      <n-form-item label="可清空">
        <n-switch
          :value="bind?.clearable !== false"
          @update:value="v => upd('clearable', v)"
        />
      </n-form-item>
    </template>
    <n-form-item label="密码框">
      <n-switch
        :value="bind?.type === 'password'"
        @update:value="v => upd('type', v ? 'password' : undefined)"
      />
    </n-form-item>
  </template>

  <template v-if="comp === 'NInputNumber'">
    <n-form-item label="最小值">
      <n-input-number
        :value="bind?.min as number | undefined"
        clearable
        @update:value="v => upd('min', v)"
      />
    </n-form-item>
    <n-form-item label="最大值">
      <n-input-number
        :value="bind?.max as number | undefined"
        clearable
        @update:value="v => upd('max', v)"
      />
    </n-form-item>
    <n-form-item label="步长">
      <n-input-number
        :value="bind?.step as number | undefined"
        :min="0"
        clearable
        @update:value="v => upd('step', v)"
      />
    </n-form-item>
    <n-form-item label="精度">
      <n-input-number
        :value="bind?.precision as number | undefined"
        :min="0"
        clearable
        @update:value="v => upd('precision', v)"
      />
    </n-form-item>
    <n-form-item label="步进按钮">
      <n-switch
        :value="bind?.showButton !== false"
        @update:value="v => upd('showButton', v)"
      />
    </n-form-item>
  </template>

  <template v-if="comp === 'NSelect'">
    <n-form-item label="可筛选">
      <n-switch
        :value="!!bind?.filterable"
        @update:value="v => upd('filterable', v || undefined)"
      />
    </n-form-item>
    <n-form-item label="可清空">
      <n-switch
        :value="bind?.clearable !== false"
        @update:value="v => upd('clearable', v)"
      />
    </n-form-item>
    <n-form-item label="标签模式">
      <n-switch
        :value="!!bind?.tag"
        @update:value="v => upd('tag', v || undefined)"
      />
    </n-form-item>
  </template>

  <template v-if="comp === 'NDatePicker'">
    <n-form-item label="日期类型">
      <n-select
        :value="String(bind?.type || 'date')"
        :options="datePickerTypeOptions"
        @update:value="v => upd('type', v === 'date' ? undefined : v)"
      />
    </n-form-item>
    <n-form-item label="显示格式">
      <n-input
        :value="String(bind?.format || '')"
        placeholder="yyyy-MM-dd"
        @update:value="v => upd('format', v || undefined)"
      />
    </n-form-item>
    <n-form-item label="值格式">
      <n-input
        :value="String(bind?.valueFormat || '')"
        placeholder="yyyy-MM-dd HH:mm:ss"
        @update:value="v => upd('valueFormat', v || undefined)"
      />
    </n-form-item>
    <n-form-item label="时间戳后缀">
      <n-input
        :value="String(bind?.dateValueSuffix ?? 'value')"
        placeholder="value"
        @update:value="v => upd('dateValueSuffix', v || undefined)"
      />
    </n-form-item>
  </template>

  <template v-if="comp === 'NTimePicker'">
    <n-form-item label="显示格式">
      <n-select
        :value="String(bind?.format || 'HH:mm:ss')"
        :options="timePickerFormatOptions"
        @update:value="v => upd('format', v === 'HH:mm:ss' ? undefined : v)"
      />
    </n-form-item>
    <n-form-item label="值格式">
      <n-input
        :value="String(bind?.valueFormat || '')"
        placeholder="HH:mm:ss"
        @update:value="v => upd('valueFormat', v || undefined)"
      />
    </n-form-item>
    <n-form-item label="时间戳后缀">
      <n-input
        :value="String(bind?.dateValueSuffix ?? 'value')"
        placeholder="value"
        @update:value="v => upd('dateValueSuffix', v || undefined)"
      />
    </n-form-item>
  </template>

  <template v-if="comp === 'NSlider'">
    <n-form-item label="最小值">
      <n-input-number
        :value="bind?.min as number | undefined"
        clearable
        @update:value="v => upd('min', v)"
      />
    </n-form-item>
    <n-form-item label="最大值">
      <n-input-number
        :value="bind?.max as number | undefined"
        clearable
        @update:value="v => upd('max', v)"
      />
    </n-form-item>
    <n-form-item label="步长">
      <n-input-number
        :value="bind?.step as number | undefined"
        :min="0"
        clearable
        @update:value="v => upd('step', v)"
      />
    </n-form-item>
    <n-form-item label="范围选择">
      <n-switch
        :value="!!bind?.range"
        @update:value="v => upd('range', v || undefined)"
      />
    </n-form-item>
  </template>

  <template v-if="comp === 'NRate'">
    <n-form-item label="星星数量">
      <n-input-number
        :value="Number(bind?.count ?? 5)"
        :min="1"
        :max="10"
        @update:value="v => upd('count', v || 5)"
      />
    </n-form-item>
    <n-form-item label="半星">
      <n-switch
        :value="!!bind?.allowHalf"
        @update:value="v => upd('allowHalf', v || undefined)"
      />
    </n-form-item>
  </template>

  <template v-if="comp === 'NSwitch'">
    <n-form-item label="选中值">
      <n-input
        :value="formatLooseValue(bind?.checkedValue ?? true)"
        placeholder="true"
        @update:value="v => upd('checkedValue', v.trim() === '' || v.trim() === 'true' ? undefined : parseLooseValue(v))"
      />
    </n-form-item>
    <n-form-item label="未选中值">
      <n-input
        :value="formatLooseValue(bind?.uncheckedValue ?? false)"
        placeholder="false"
        @update:value="v => upd('uncheckedValue', v.trim() === '' || v.trim() === 'false' ? undefined : parseLooseValue(v))"
      />
    </n-form-item>
  </template>

  <template v-if="comp === 'NDynamicInput'">
    <n-form-item label="预设类型">
      <n-select
        :value="String(bind?.preset || 'input')"
        :options="dynamicInputPresetOptions"
        @update:value="v => upd('preset', v === 'input' ? undefined : v)"
      />
    </n-form-item>
    <n-form-item label="键占位符">
      <n-input
        :value="String(bind?.keyPlaceholder || '')"
        @update:value="v => upd('keyPlaceholder', v || undefined)"
      />
    </n-form-item>
    <n-form-item label="值占位符">
      <n-input
        :value="String(bind?.valuePlaceholder || '')"
        @update:value="v => upd('valuePlaceholder', v || undefined)"
      />
    </n-form-item>
  </template>

  <template v-if="comp === 'NDynamicTags'">
    <n-form-item label="最大标签数">
      <n-input-number
        :value="bind?.max as number | undefined"
        :min="1"
        clearable
        @update:value="v => upd('max', v)"
      />
    </n-form-item>
  </template>

  <template v-if="comp === 'NInputOtp'">
    <n-form-item label="位数">
      <n-input-number
        :value="Number(bind?.length ?? 6)"
        :min="1"
        :max="12"
        @update:value="v => upd('length', v == null || v === 6 ? undefined : v)"
      />
    </n-form-item>
    <n-form-item label="掩码">
      <n-switch
        :value="!!bind?.mask"
        @update:value="v => upd('mask', v || undefined)"
      />
    </n-form-item>
  </template>

  <template v-if="['NAutoComplete', 'NMention'].includes(comp)">
    <n-form-item label="可清空">
      <n-switch
        :value="bind?.clearable !== false"
        @update:value="v => upd('clearable', v)"
      />
    </n-form-item>
  </template>

  <template v-if="comp === 'NTransfer'">
    <n-form-item label="可筛选">
      <n-switch
        :value="!!bind?.filterable"
        @update:value="v => upd('filterable', v || undefined)"
      />
    </n-form-item>
    <n-form-item label="源列表筛选">
      <n-switch
        :value="!!bind?.sourceFilterable"
        @update:value="v => upd('sourceFilterable', v || undefined)"
      />
    </n-form-item>
    <n-form-item label="目标列表筛选">
      <n-switch
        :value="!!bind?.targetFilterable"
        @update:value="v => upd('targetFilterable', v || undefined)"
      />
    </n-form-item>
  </template>

  <template v-if="comp === 'NUpload'">
    <n-form-item label="列表类型">
      <n-select
        :value="String(bind?.listType || 'text')"
        :options="[
          { label: '文本', value: 'text' },
          { label: '图片', value: 'image' },
          { label: '图片卡片', value: 'image-card' },
        ]"
        @update:value="v => upd('listType', v === 'text' ? undefined : v)"
      />
    </n-form-item>
    <n-form-item label="多选">
      <n-switch
        :value="!!bind?.multiple"
        @update:value="v => upd('multiple', v || undefined)"
      />
    </n-form-item>
    <n-form-item label="最大数量">
      <n-input-number
        :value="bind?.max as number | undefined"
        :min="1"
        clearable
        @update:value="v => upd('max', v)"
      />
    </n-form-item>
  </template>

  <template v-if="comp === 'UploadFile'">
    <n-form-item label="数量限制">
      <n-input-number
        :value="Number(bind?.limit ?? 5)"
        :min="1"
        @update:value="v => upd('limit', v === 5 ? undefined : v)"
      />
    </n-form-item>
    <n-form-item label="大小限制(MB)">
      <n-input-number
        :value="Number(bind?.fileSize ?? 0)"
        :min="0"
        @update:value="v => upd('fileSize', !v ? undefined : v)"
      />
    </n-form-item>
    <n-form-item label="文件类型">
      <n-input
        :value="String(bind?.fileType || '')"
        placeholder="img,office,pdf"
        @update:value="v => upd('fileType', v || undefined)"
      />
    </n-form-item>
    <n-form-item label="拖拽上传">
      <n-switch
        :value="!!bind?.drag"
        @update:value="v => upd('drag', v || undefined)"
      />
    </n-form-item>
  </template>

  <template v-if="comp === 'ImageCropper'">
    <n-form-item label="宽高比">
      <n-input-number
        :value="Number(bind?.aspectRatio ?? 1)"
        :min="0.1"
        :step="0.1"
        @update:value="v => upd('aspectRatio', v == null || v === 1 ? undefined : v)"
      />
    </n-form-item>
    <n-form-item label="输出宽度">
      <n-input-number
        :value="Number(bind?.outputSize ?? 200)"
        :min="32"
        @update:value="v => upd('outputSize', v == null || v === 200 ? undefined : v)"
      />
    </n-form-item>
    <n-form-item label="输出格式">
      <n-select
        :value="String(bind?.mimeType || 'image/jpeg')"
        :options="[
          { label: 'JPEG', value: 'image/jpeg' },
          { label: 'PNG', value: 'image/png' },
        ]"
        @update:value="v => upd('mimeType', v === 'image/jpeg' ? undefined : v)"
      />
    </n-form-item>
    <n-form-item label="质量">
      <n-input-number
        :value="Number(bind?.quality ?? 0.92)"
        :min="0.1"
        :max="1"
        :step="0.01"
        @update:value="v => upd('quality', v == null || v === 0.92 ? undefined : v)"
      />
    </n-form-item>
  </template>

  <template v-if="comp === 'Editor'">
    <n-form-item label="高度">
      <n-input-number
        :value="bind?.height as number | undefined"
        :min="100"
        clearable
        placeholder="默认"
        @update:value="v => upd('height', v)"
      />
    </n-form-item>
    <n-form-item label="占位符">
      <n-input
        :value="String(bind?.placeholder || '')"
        @update:value="v => upd('placeholder', v || undefined)"
      />
    </n-form-item>
  </template>

  <template v-if="comp === 'IconSelect'">
    <n-form-item label="可清空">
      <n-switch
        :value="bind?.clearable !== false"
        @update:value="v => upd('clearable', v)"
      />
    </n-form-item>
  </template>

  <template v-if="comp === 'UserSelect'">
    <n-form-item label="多选">
      <n-switch
        :value="bind?.multiple !== false"
        @update:value="v => upd('multiple', v)"
      />
    </n-form-item>
    <n-form-item label="占位符">
      <n-input
        :value="String(bind?.placeholder || '')"
        placeholder="请选择用户"
        @update:value="v => upd('placeholder', v || undefined)"
      />
    </n-form-item>
  </template>

  <template v-if="comp === 'CronInput'">
    <n-form-item label="占位符">
      <n-input
        :value="String(bind?.placeholder || '')"
        @update:value="v => upd('placeholder', v || undefined)"
      />
    </n-form-item>
  </template>

  <template v-if="comp === 'NColorPicker'">
    <n-form-item label="颜色模式">
      <n-select
        :value="(bind?.modes as string[] | undefined)?.[0] || 'hex'"
        :options="colorModeOptions"
        @update:value="v => upd('modes', v === 'hex' ? undefined : [v])"
      />
    </n-form-item>
    <n-form-item label="显示透明度">
      <n-switch
        :value="bind?.showAlpha !== false"
        @update:value="v => upd('showAlpha', v)"
      />
    </n-form-item>
  </template>

  <template v-if="comp === 'SqlSearch'">
    <n-form-item label="最大嵌套层级">
      <n-input-number
        :value="Number(bind?.maxDepth ?? 0)"
        :min="0"
        :max="20"
        placeholder="0 = 无限"
        @update:value="v => upd('maxDepth', v == null || v <= 0 ? undefined : v)"
      />
    </n-form-item>
    <n-form-item label="显示 SQL 预览">
      <n-switch
        :value="bind?.showSqlPreview !== false"
        @update:value="v => upd('showSqlPreview', v === false ? false : undefined)"
      />
    </n-form-item>
    <n-form-item label="显示复制 SQL">
      <n-switch
        :value="bind?.showCopySql !== false"
        @update:value="v => upd('showCopySql', v === false ? false : undefined)"
      />
    </n-form-item>
    <n-form-item label="校验模式">
      <n-select
        :value="String(bind?.validationMode ?? 'lenient')"
        :options="[
          { label: '宽松（忽略空白行）', value: 'lenient' },
          { label: '严格（每行须完整）', value: 'strict' },
        ]"
        @update:value="v => upd('validationMode', v === 'lenient' ? undefined : v)"
      />
    </n-form-item>
    <n-form-item label="Params 字段名">
      <n-input
        :value="String(bind?.paramsKey || '')"
        placeholder="默认 {fieldKey}Params"
        @update:value="v => upd('paramsKey', v || undefined)"
      />
    </n-form-item>
    <n-form-item label="SQL 字段名">
      <n-input
        :value="String(bind?.sqlKey || '')"
        placeholder="默认 {fieldKey}Sql"
        @update:value="v => upd('sqlKey', v || undefined)"
      />
    </n-form-item>
    <n-form-item label="搜索字段 (JSON)">
      <n-input
        type="textarea"
        :value="JSON.stringify(bind?.fields ?? [], null, 2)"
        :autosize="{ minRows: 6, maxRows: 16 }"
        placeholder='[{"key":"name","label":"名称","type":"string"}]'
        @update:value="(v) => {
          try {
            upd('fields', v.trim() ? JSON.parse(v) : undefined)
          }
          catch {
            // 编辑中允许无效 JSON
          }
        }"
      />
    </n-form-item>
  </template>

  <template v-if="comp === 'DeptSelect'">
    <n-form-item label="可筛选">
      <n-switch
        :value="bind?.filterable !== false"
        @update:value="v => upd('filterable', v)"
      />
    </n-form-item>
    <n-form-item label="可清空">
      <n-switch
        :value="bind?.clearable !== false"
        @update:value="v => upd('clearable', v)"
      />
    </n-form-item>
    <n-form-item label="仅启用部门">
      <n-switch
        :value="bind?.onlyEnabled !== false"
        @update:value="v => upd('onlyEnabled', v)"
      />
    </n-form-item>
  </template>

  <template v-if="['NCascader', 'NTreeSelect'].includes(comp)">
    <n-form-item label="可筛选">
      <n-switch
        :value="!!bind?.filterable"
        @update:value="v => upd('filterable', v || undefined)"
      />
    </n-form-item>
    <n-form-item label="可清空">
      <n-switch
        :value="bind?.clearable !== false"
        @update:value="v => upd('clearable', v)"
      />
    </n-form-item>
  </template>
</template>
