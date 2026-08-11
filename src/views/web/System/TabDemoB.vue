<template>
  <div class="system-page">
    <n-card :bordered="false" title="扩展信息">
      <n-descriptions label-placement="left" :column="1" bordered size="small">
        <n-descriptions-item label="父菜单 component">
          TabView
        </n-descriptions-item>
        <n-descriptions-item label="子菜单类型">
          页面级菜单（P / type=4）
        </n-descriptions-item>
        <n-descriptions-item label="侧栏可见">
          否（visible=0 / hidden）
        </n-descriptions-item>
        <n-descriptions-item label="高亮菜单">
          activeMenu = System-TabDemo
        </n-descriptions-item>
      </n-descriptions>
      <p class="hint">
        在「菜单管理」中：父菜单组件填 <code>TabView</code>，子菜单选「页面级菜单」即可。
      </p>
    </n-card>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'System-TabDemoB' })
</script>

<style scoped>
.hint {
  margin-top: 16px;
  color: var(--n-text-color-3);
  font-size: 13px;
  line-height: 1.6;
}
</style>
