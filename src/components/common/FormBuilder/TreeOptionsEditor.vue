<script setup lang="ts">
import TreeOptionNodeItem from './TreeOptionNodeItem.vue'

export interface TreeOptionNode {
  label: string
  value: string
  children?: TreeOptionNode[]
}

const model = defineModel<TreeOptionNode[]>({ default: () => [] })

function createNode(): TreeOptionNode {
  return { label: '节点', value: '' }
}

function touch() {
  model.value = [...model.value]
}

function addRoot() {
  model.value = [...model.value, createNode()]
}

function removeRoot(index: number) {
  model.value = model.value.filter((_, i) => i !== index)
}
</script>

<template>
  <div class="tree-options-editor">
    <div v-if="!model.length" class="tree-options-editor__empty">
      暂无节点，点击下方添加
    </div>
    <TreeOptionNodeItem
      v-for="(node, index) in model"
      :key="index"
      :node="node"
      @change="touch"
      @remove="removeRoot(index)"
    />
    <n-button size="tiny" dashed block @click="addRoot">
      添加根节点
    </n-button>
  </div>
</template>

<style scoped>
.tree-options-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.tree-options-editor__empty {
  font-size: 12px;
  color: var(--n-text-color-3);
}
</style>
