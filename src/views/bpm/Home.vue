<template>
  <div class="bpm-home">
    <header class="bpm-home__header">
      <h1>流程设计工作台</h1>
      <p>管理流程模型，或打开简易 / BPMN 设计器。嵌入主应用时（iframe / <code>?hideMenu=1</code>）自动隐藏侧栏。</p>
    </header>

    <div class="bpm-home__cards">
      <router-link class="bpm-card" :to="{ name: 'BpmProcessInstanceCreate' }">
        <h2>发起流程</h2>
        <p>选择已发布流程，填写表单并提交。</p>
      </router-link>
      <router-link class="bpm-card" :to="{ name: 'BpmTask' }">
        <h2>待办任务</h2>
        <p>办理审批、查看已办记录。</p>
      </router-link>
      <router-link class="bpm-card" :to="{ name: 'BpmTaskCopy' }">
        <h2>抄送我的</h2>
        <p>查看知会给我的流程抄送记录。</p>
      </router-link>
      <router-link class="bpm-card" :to="{ name: 'BpmModel' }">
        <h2>流程模型</h2>
        <p>创建、编辑、复制与发布流程模型。</p>
      </router-link>
      <router-link class="bpm-card" :to="{ name: 'BpmSimpleDesign' }">
        <h2>简易流程设计器</h2>
        <p>钉钉 / 飞书风格节点编排。</p>
      </router-link>
      <router-link class="bpm-card" :to="{ name: 'BpmnDesign' }">
        <h2>BPMN 设计器</h2>
        <p>标准 BPMN 2.0 画布与属性面板。</p>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'BpmHome' })
</script>

<style scoped>
.bpm-home {
  padding: 8px 4px 24px;
}
.bpm-home__header {
  margin-bottom: 20px;
}
.bpm-home__header h1 {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
}
.bpm-home__header p {
  margin: 0;
  color: #6b7280;
  line-height: 1.6;
}
.bpm-home__cards {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}
.bpm-card {
  display: block;
  padding: 20px;
  border-radius: 12px;
  background: var(--n-color, #fff);
  border: 1px solid var(--n-border-color, #e5e7eb);
  text-decoration: none;
  color: inherit;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}
.bpm-card:hover {
  border-color: var(--n-primary-color, #0089ff);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--n-primary-color, #0089ff) 12%, transparent);
  transform: translateY(-2px);
}
.bpm-card h2 {
  margin: 0 0 8px;
  font-size: 17px;
  color: var(--n-text-color, #111827);
}
.bpm-card p {
  margin: 0;
  font-size: 14px;
  color: var(--n-text-color-3, #6b7280);
  line-height: 1.5;
}

:global(html.dark) .bpm-card {
  background: #18181c;
  border-color: rgba(255, 255, 255, 0.09);
}
</style>
