<template>
  <div class="detail-education-exp">
    <UxTable :data="educationExp.tableData">
      <UxTableColumn v-for="(col, i) in educationExp.tableColumns" :key="i" :config="col"></UxTableColumn>
    </UxTable>
    <div class="ctrl">
      <el-button type="primary">编辑</el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
// 教育经历
const educationExp = reactive({
  tableColumns: [
    { label: "时间", prop: "c0", align: "center" },
    { label: "学校", prop: "c1", align: "center", useTooltip: true },
    { label: "专业", prop: "c2", align: "center", useTooltip: true },
    { label: "学位", prop: "c3", align: "center", useTooltip: true },
  ],
  tableData: [
    { c0: "-", c1: "-", c2: "-", c3: "-" },
    { c0: "-", c1: "-", c2: "-", c3: "-" },
  ],
});
</script>

<style lang="scss" scoped>
.detail-education-exp {
  position: relative;
  .ctrl {
    position: absolute;
    top: -40px;
    right: 0;
    z-index: 1;
  }
}
</style>
