<script setup lang="ts">
import type { TreeOptionNode } from './TreeOptionsEditor.vue'
import TreeOptionNodeItem from './TreeOptionNodeItem.vue'

const props = withDefaults(defineProps<{
  node: TreeOptionNode
  depth?: number
}>(), {
  depth: 0,
})

const emit = defineEmits<{
  change: []
  remove: []
}>()

function createNode(): TreeOptionNode {
  return { label: '节点', value: '' }
}

function touch() {
  emit('change')
}

function updateSelf(patch: Partial<TreeOptionNode>) {
  Object.assign(props.node, patch)
  touch()
}

function addChild() {
  props.node.children = [...(props.node.children || []), createNode()]
  touch()
}

function removeChild(index: number) {
  props.node.children = (props.node.children || []).filter((_, i) => i !== index)
  touch()
}
</script>

<template>
  <div
    class="tree-option-node"
    :class="{ 'tree-option-node--nested': depth > 0 }"
    :style="{ '--tree-depth': depth }"
  >
    <div class="tree-option-node__row">
      <n-input
        :value="node.label"
        :placeholder="depth > 0 ? '子标签' : '标签'"
        @update:value="v => updateSelf({ label: v })"
      />
      <n-input
        :value="node.value"
        :placeholder="depth > 0 ? '子值' : '值'"
        @update:value="v => updateSelf({ value: v })"
      />
      <n-button size="tiny" @click="addChild">
        子节点
      </n-button>
      <n-button quaternary circle size="tiny" @click="emit('remove')">
        ×
      </n-button>
    </div>
    <div v-if="node.children?.length" class="tree-option-node__children">
      <TreeOptionNodeItem
        v-for="(child, childIndex) in node.children"
        :key="childIndex"
        :node="child"
        :depth="depth + 1"
        @change="touch"
        @remove="removeChild(childIndex)"
      />
    </div>
  </div>
</template>

<style scoped>
.tree-option-node {
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  padding: 8px;
}

.tree-option-node--nested {
  border-style: dashed;
  background: var(--n-color-modal);
}

.tree-option-node__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto auto;
  gap: 6px;
  align-items: center;
}

.tree-option-node__children {
  margin-top: 8px;
  padding-left: 12px;
  border-left: 2px solid var(--n-border-color);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
