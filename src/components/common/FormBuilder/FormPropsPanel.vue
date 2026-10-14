<script setup lang="ts">
import type { BpmFormSettings, FormLabelPlacement, FormSize } from './bpmForm'
import { formLabelPlacementOptions, formSizeOptions } from './constants'
import { FORM_EVENT_DEFS } from './formEvents'

const props = defineProps<{
  settings: BpmFormSettings
}>()

const emit = defineEmits<{
  update: [patch: Partial<BpmFormSettings>]
}>()

function upd<K extends keyof BpmFormSettings>(key: K, value: BpmFormSettings[K]) {
  emit('update', { [key]: value })
}

function updEvent(key: typeof FORM_EVENT_DEFS[number]['key'], value: string) {
  const trimmed = value.trim()
  emit('update', { [key]: trimmed || undefined })
}
</script>

<template>
  <div class="form-props-panel">
    <section class="form-props-section">
      <div class="form-props-section__title">布局</div>
      <n-form label-placement="top" size="small" :show-feedback="false">
        <n-grid :cols="2" :x-gap="8">
          <n-gi>
            <n-form-item label="列数">
              <n-input-number
                :value="settings.formCols"
                :min="1"
                :max="4"
                style="width: 100%"
                @update:value="v => upd('formCols', v || 1)"
              />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="标签宽度">
              <n-input-number
                :value="typeof settings.labelWidth === 'number' ? settings.labelWidth : 100"
                :min="60"
                :max="240"
                :step="10"
                style="width: 100%"
                @update:value="v => upd('labelWidth', v || 100)"
              />
            </n-form-item>
          </n-gi>
        </n-grid>
        <n-form-item label="标签位置">
          <n-radio-group
            :value="settings.labelPlacement"
            size="small"
            @update:value="(v: FormLabelPlacement) => upd('labelPlacement', v)"
          >
            <n-radio-button
              v-for="opt in formLabelPlacementOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </n-radio-button>
          </n-radio-group>
        </n-form-item>
        <n-form-item label="表单尺寸">
          <n-radio-group
            :value="settings.size"
            size="small"
            @update:value="(v: FormSize) => upd('size', v)"
          >
            <n-radio-button
              v-for="opt in formSizeOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </n-radio-button>
          </n-radio-group>
        </n-form-item>
        <n-form-item label="标签后缀">
          <n-input
            :value="settings.labelSuffix"
            placeholder="如 ：或 :"
            clearable
            @update:value="v => upd('labelSuffix', v || '')"
          />
        </n-form-item>
      </n-form>
    </section>

    <section class="form-props-section">
      <div class="form-props-section__title">校验与按钮</div>
      <n-form label-placement="top" size="small" :show-feedback="false">
        <n-grid :cols="2" :x-gap="8">
          <n-gi>
            <n-form-item label="显示必填星号">
              <n-switch
                :value="settings.showRequireMark"
                @update:value="v => upd('showRequireMark', v)"
              />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="显示校验信息">
              <n-switch
                :value="settings.showFeedback"
                @update:value="v => upd('showFeedback', v)"
              />
            </n-form-item>
          </n-gi>
        </n-grid>
        <n-grid :cols="2" :x-gap="8">
          <n-gi>
            <n-form-item label="预览提交按钮">
              <n-switch
                :value="settings.showSubmitBtn"
                @update:value="v => upd('showSubmitBtn', v)"
              />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="预览重置按钮">
              <n-switch
                :value="settings.showResetBtn"
                @update:value="v => upd('showResetBtn', v)"
              />
            </n-form-item>
          </n-gi>
        </n-grid>
        <div class="form-props-panel__hint">
          提交流程表单时由页面操作区负责提交；此处按钮仅影响设计器预览。
        </div>
      </n-form>
    </section>

    <section class="form-props-section">
      <div class="form-props-section__title">表单事件</div>
      <n-form label-placement="top" size="small" :show-feedback="false">
        <n-form-item
          v-for="ev in FORM_EVENT_DEFS"
          :key="ev.key"
          :label="ev.label"
        >
          <n-input
            type="textarea"
            :rows="2"
            :value="settings[ev.key] || ''"
            :placeholder="ev.placeholder || `参数：${ev.args}`"
            @update:value="v => updEvent(ev.key, v)"
          />
          <div class="form-props-panel__hint">
            {{ ev.hint }}；参数：{{ ev.args }}
          </div>
        </n-form-item>
        <n-alert type="info" :bordered="false" class="form-props-panel__alert">
          填写函数体即可；api 提供 formData / getValue / setValue / validate / reset
        </n-alert>
      </n-form>
    </section>
  </div>
</template>

<style scoped>
.form-props-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-props-section__title {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--n-text-color-2);
}

.form-props-panel__hint {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--n-text-color-3);
}

.form-props-panel__alert {
  margin-top: 4px;
}
</style>
