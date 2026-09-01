<!--
 * 表格列设置：拖拽调整顺序 + 开关控制显隐
 -->
<template>
  <n-drawer v-model:show="visible" :width="400" placement="right">
    <n-drawer-content title="列设置" closable>
      <div class="col-setting">
        <div class="col-setting__header">
          <span class="col-setting__hint">拖动调整顺序，开关控制显示</span>
          <n-button text type="primary" size="small" @click="handleReset">
            重置
          </n-button>
        </div>

        <div class="col-setting__list-head">
          <span>列名</span>
          <span>显示</span>
        </div>

        <draggable
          v-model="list"
          item-key="key"
          handle=".col-setting__handle"
          animation="200"
          ghost-class="col-setting__ghost"
          class="col-setting__list"
          @end="persist"
        >
          <template #item="{ element }">
            <div class="col-setting__item">
              <div class="col-setting__left">
                <n-icon class="col-setting__handle" size="16">
                  <MenuOutline />
                </n-icon>
                <span class="col-setting__label">{{ element.label }}</span>
              </div>
              <n-switch
                :value="element.isShow"
                size="small"
                @update:value="(val: boolean) => toggleShow(element.key, val)"
              />
            </div>
          </template>
        </draggable>

        <n-empty v-if="!list.length" description="暂无可配置列" class="col-setting__empty" />
      </div>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup lang="ts">
import { MenuOutline } from '@vicons/ionicons5'
import Draggable from 'vuedraggable'
import type { ColSettingItem } from './types'
import { clearColSetting, saveColSetting } from './colSetting'

const props = defineProps<{
  /** local 键名，用于持久化 */
  storageKey: string
}>()

const emit = defineEmits<{
  change: [items: ColSettingItem[]]
  reset: []
}>()

const visible = ref(false)
const list = ref<ColSettingItem[]>([])

function open(items: ColSettingItem[]) {
  list.value = items.map(item => ({ ...item }))
  visible.value = true
}

function persist() {
  if (props.storageKey)
    saveColSetting(props.storageKey, list.value)
  emit('change', list.value.map(item => ({ ...item })))
}

function toggleShow(key: string, isShow: boolean) {
  const target = list.value.find(item => item.key === key)
  if (!target)
    return
  target.isShow = isShow
  persist()
}

function handleReset() {
  if (props.storageKey)
    clearColSetting(props.storageKey)
  emit('reset')
}

defineExpose({ open })
</script>

<style scoped>
.col-setting__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.col-setting__hint {
  font-size: 12px;
  color: var(--n-text-color-3);
}

.col-setting__list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--n-text-color-2);
  border-bottom: 1px solid var(--n-divider-color);
}

.col-setting__list {
  display: flex;
  flex-direction: column;
}

.col-setting__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--n-divider-color);
  background: var(--n-color);
  user-select: none;
}

.col-setting__left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.col-setting__handle {
  flex-shrink: 0;
  cursor: grab;
  color: var(--n-text-color-3);
}

.col-setting__handle:active {
  cursor: grabbing;
}

.col-setting__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.col-setting__ghost {
  opacity: 0.5;
  background: var(--n-color-hover);
}

.col-setting__empty {
  margin-top: 48px;
}
</style>
