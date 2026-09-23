<template>
  <div class="bpm-model-list">
    <header class="bpm-model-list__header">
      <div>
        <h1>流程模型</h1>
        <p>创建、编辑、复制、发布与版本管理</p>
      </div>
    </header>
    <!-- 复用主应用 Model 列表（分类分组 + 权限 + 报表） -->
    <Model />
  </div>
</template>

<script setup lang="ts">
import Model from '@/views/web/Bpm/Model.vue'

defineOptions({ name: 'BpmModel' })
</script>

<style scoped>
.bpm-model-list {
  padding: 0 0 24px;
}
.bpm-model-list__header {
  margin: 0 0 16px;
}
.bpm-model-list__header h1 {
  margin: 0 0 6px;
  font-size: 20px;
  color: #111827;
}
.bpm-model-list__header p {
  margin: 0;
  color: #6b7280;
}
</style>
