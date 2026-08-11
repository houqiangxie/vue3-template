<template>
  <div class="system-page">
    <n-card :bordered="false" title="基础信息">
      <n-form label-placement="left" label-width="88" :show-feedback="false">
        <n-form-item label="示例名称">
          <n-input v-model:value="form.name" placeholder="页签内表单可独立维护状态" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input
            v-model:value="form.remark"
            type="textarea"
            :rows="3"
            placeholder="切换 Tab 后本页状态会保留（display-directive=show:lazy）"
          />
        </n-form-item>
      </n-form>
      <p class="hint">
        侧栏只显示父级「页签示例」；子页由 TabView 以页内 tabs 渲染，URL 用
        <code>?_tab=System-TabDemoA</code> 同步。
      </p>
    </n-card>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'System-TabDemoA' })

const form = reactive({
  name: 'Tab A',
  remark: '',
})
</script>

<style scoped>
.hint {
  margin-top: 16px;
  color: var(--n-text-color-3);
  font-size: 13px;
  line-height: 1.6;
}
</style>
