<script setup lang="ts">
import type { SqlSearchGroup as SqlSearchGroupType, SqlSearchNode } from './types'
import Draggable from 'vuedraggable'
import { SQL_SEARCH_CONTEXT_KEY } from './context'
import { sqlSearchLabels } from './labels'
import SqlSearchCondition from './SqlSearchCondition.vue'
import {
  isSqlSearchCondition,
  isSqlSearchGroup,
} from './utils'

defineOptions({ name: 'SqlSearchGroup' })

const props = withDefaults(defineProps<{
  group: SqlSearchGroupType
  depth?: number
  maxDepth?: number
  removable?: boolean
}>(), {
  depth: 0,
  maxDepth: 0,
  removable: false,
})

const ctx = inject(SQL_SEARCH_CONTEXT_KEY)
if (!ctx)
  throw new Error('[SqlSearchGroup] must be used inside SqlSearch')

const { tree, disabled } = ctx

const logicOptions = [
  { label: sqlSearchLabels.logicAnd, value: 'and' },
  { label: sqlSearchLabels.logicOr, value: 'or' },
]

const collapsed = ref(false)

const canAddGroup = computed(() => {
  if (!props.maxDepth || props.maxDepth <= 0)
    return true
  return props.depth < props.maxDepth - 1
})

const canCollapse = computed(() => props.depth >= 0)

function patchGroup(patch: Partial<SqlSearchGroupType>) {
  tree.patchNode(props.group.id, patch)
}

function toggleNot() {
  patchGroup({ not: props.group.not ? undefined : true })
}

function removeChild(index: number) {
  const child = props.group.children[index]
  if (child)
    tree.removeNode(child.id)
}

function addCondition() {
  tree.addCondition(props.group.id)
}

function addGroup() {
  if (!canAddGroup.value)
    return
  tree.addGroup(props.group.id)
}

function onChildrenReorder(children: SqlSearchNode[]) {
  tree.reorderChildren(
    props.group.id,
    children.filter((child): child is SqlSearchNode => isSqlSearchGroup(child) || isSqlSearchCondition(child)),
  )
}

function removeSelf() {
  tree.removeNode(props.group.id)
}
</script>

<template>
  <div
    v-if="group"
    class="sql-search-group"
    :class="{
      'sql-search-group--nested': depth > 0,
      'sql-search-group--collapsed': collapsed,
    }"
  >
    <div class="sql-search-group__toolbar">
      <span
        v-if="depth > 0"
        class="sql-search-drag"
        :title="sqlSearchLabels.dragHandle"
        role="button"
        :aria-label="sqlSearchLabels.dragHandle"
      >
        ⋮⋮
      </span>

      <n-tag v-if="depth === 0" size="small" :bordered="false" type="info">
        {{ sqlSearchLabels.group }}
      </n-tag>
      <n-tag v-else size="small" :bordered="false">
        {{ sqlSearchLabels.nestedGroup(depth + 1) }}
      </n-tag>

      <div class="sql-search-group__logic">
        <n-radio-group
          :value="group.logic"
          size="small"
          :disabled="disabled"
          @update:value="v => patchGroup({ logic: v as 'and' | 'or' })"
        >
          <n-radio-button
            v-for="opt in logicOptions"
            :key="opt.value"
            :value="opt.value"
            :label="opt.label"
          />
        </n-radio-group>
        <n-button
          size="small"
          :type="group.not ? 'warning' : 'default'"
          :secondary="!!group.not"
          :disabled="disabled"
          @click="toggleNot"
        >
          {{ sqlSearchLabels.not }}
        </n-button>
      </div>

      <div class="sql-search-group__actions">
        <n-button
          v-if="canCollapse"
          size="tiny"
          quaternary
          @click="collapsed = !collapsed"
        >
          {{ collapsed ? sqlSearchLabels.expand : sqlSearchLabels.collapse }}
        </n-button>
        <n-button
          size="tiny"
          dashed
          :disabled="disabled"
          @click="addCondition"
        >
          {{ sqlSearchLabels.addCondition }}
        </n-button>
        <n-button
          v-if="canAddGroup"
          size="tiny"
          dashed
          :disabled="disabled"
          @click="addGroup"
        >
          {{ sqlSearchLabels.addGroup }}
        </n-button>
        <n-button
          v-if="removable"
          size="tiny"
          quaternary
          type="error"
          :disabled="disabled"
          @click="removeSelf"
        >
          {{ sqlSearchLabels.removeGroup }}
        </n-button>
      </div>
    </div>

    <div v-show="!collapsed" class="sql-search-group__body">
      <Draggable
        class="sql-search-group__list"
        :model-value="group.children"
        item-key="id"
        handle=".sql-search-drag"
        :animation="180"
        :disabled="disabled"
        ghost-class="sql-search-ghost"
        @update:model-value="onChildrenReorder"
      >
        <template #item="{ element, index }">
          <div class="sql-search-group__item">
            <SqlSearchGroup
              v-if="isSqlSearchGroup(element)"
              :group="element"
              :depth="depth + 1"
              :max-depth="maxDepth"
              removable
            />
            <SqlSearchCondition
              v-else-if="isSqlSearchCondition(element)"
              :condition="element"
              @remove="removeChild(index)"
            />
          </div>
        </template>
      </Draggable>

      <n-empty
        v-if="!group.children.length"
        size="small"
        :description="sqlSearchLabels.empty"
        style="padding: 12px 0"
      />
    </div>
  </div>
</template>

<style scoped>
.sql-search-group {
  width: 100%;
  border: 1px solid var(--n-border-color);
  border-radius: var(--n-border-radius);
  background: var(--n-color);
  box-sizing: border-box;
}

.sql-search-group--nested {
  background: var(--n-color-modal);
}

.sql-search-group__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--n-border-color);
  background: var(--n-color-modal);
}

.sql-search-group--collapsed .sql-search-group__toolbar {
  border-bottom: none;
}

.sql-search-group__logic {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.sql-search-group__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-left: auto;
}

.sql-search-group__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
}

.sql-search-group__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sql-search-group__item {
  width: 100%;
}

.sql-search-drag {
  flex-shrink: 0;
  cursor: grab;
  user-select: none;
  color: var(--n-text-color-3);
  font-size: 12px;
  letter-spacing: -2px;
  padding: 0 2px;
  line-height: 1;
}

.sql-search-drag:active {
  cursor: grabbing;
}

:deep(.sql-search-ghost) {
  opacity: 0.45;
}
</style>
