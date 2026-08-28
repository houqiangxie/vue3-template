<script setup lang="ts">
import type { FieldBind } from '@/components/common/table/fieldSchema'
import type { BuilderField } from './types'
import { supportsClearable, supportsFilterable, supportsMultiple } from './utils'

const props = defineProps<{
  field: BuilderField
  scene: 'form' | 'search'
}>()

const component = computed(() => String(props.field.component || 'NInput'))
const showMultiple = computed(() => supportsMultiple(component.value))
const showFilterable = computed(() => supportsFilterable(component.value))
const showClearable = computed(() => supportsClearable(component.value))

const enabled = computed({
  get: () => {
    const config = props.scene === 'form' ? props.field.form : props.field.search
    if (config === false || config == null)
      return false
    return !!config.bind
  },
  set: (value: boolean) => {
    if (props.scene === 'form') {
      if (props.field.form === false || props.field.form == null)
        props.field.form = { span: 1 }
      const form = props.field.form!
      if (value)
        form.bind = form.bind || {}
      else
        delete form.bind
      return
    }
    if (props.field.search === false || props.field.search == null)
      props.field.search = { span: 8 }
    const search = props.field.search!
    if (value)
      search.bind = search.bind || {}
    else
      delete search.bind
  },
})

const sceneBind = computed((): FieldBind => {
  const config = props.scene === 'form' ? props.field.form : props.field.search
  if (!config)
    return {}
  const bind = config.bind
  if (!bind)
    return {}
  return Array.isArray(bind) ? (bind[0] || {}) : bind
})

function updateSceneBind(key: string, value: unknown) {
  const config = props.scene === 'form' ? props.field.form : props.field.search
  if (!config)
    return
  const current = sceneBind.value
  const next: FieldBind = { ...current }
  if (value == null || value === '')
    delete next[key]
  else
    next[key] = value

  // NTransfer 的筛选实际由 source/targetFilterable 控制
  if (key === 'filterable' && component.value === 'NTransfer') {
    if (value == null || value === '') {
      delete next.sourceFilterable
      delete next.targetFilterable
    }
    else {
      next.sourceFilterable = value
      next.targetFilterable = value
    }
  }

  config.bind = next
}

/** 场景覆盖需显式写 true/false，才能覆盖基础 bind 中的同名键 */
function updateSceneFlag(key: string, value: boolean) {
  updateSceneBind(key, value)
}
</script>

<template>
  <n-form-item :label="scene === 'form' ? '表单覆盖 bind' : '搜索覆盖 bind'">
    <n-switch v-model:value="enabled" />
  </n-form-item>
  <template v-if="enabled">
    <n-form-item label="占位符">
      <n-input
        :value="String(sceneBind.placeholder || '')"
        @update:value="updateSceneBind('placeholder', $event || undefined)"
      />
    </n-form-item>
    <n-form-item label="禁用">
      <n-switch
        :value="!!sceneBind.disabled"
        @update:value="v => updateSceneFlag('disabled', v)"
      />
    </n-form-item>
    <n-form-item label="只读">
      <n-switch
        :value="!!sceneBind.readonly"
        @update:value="v => updateSceneFlag('readonly', v)"
      />
    </n-form-item>
    <n-form-item v-if="showMultiple" label="多选">
      <n-switch
        :value="!!sceneBind.multiple"
        @update:value="v => updateSceneFlag('multiple', v)"
      />
    </n-form-item>
    <n-form-item v-if="showFilterable" label="可筛选">
      <n-switch
        :value="!!sceneBind.filterable || !!sceneBind.sourceFilterable"
        @update:value="v => updateSceneFlag('filterable', v)"
      />
    </n-form-item>
    <n-form-item v-if="showClearable" label="可清空">
      <n-switch
        :value="!!sceneBind.clearable"
        @update:value="v => updateSceneFlag('clearable', v)"
      />
    </n-form-item>
  </template>
</template>
