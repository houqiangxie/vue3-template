<template>
  <div class="detail-family-members">
    <UxTable :data="familyMembers.tableData">
      <UxTableColumn v-for="(col, i) in familyMembers.tableColumns" :key="i" :config="col"></UxTableColumn>
    </UxTable>
  </div>
</template>

<script lang="ts" setup>
// 家庭成员
const familyMembers = reactive({
  tableColumns: [
    { label: "姓名", prop: "c0", align: "center" },
    { label: "称谓", prop: "c1", align: "center", useTooltip: true },
    { label: "工作单位", prop: "c2", align: "center", useTooltip: true },
    { label: "职业", prop: "c3", align: "center", useTooltip: true },
    { label: "政治面貌", prop: "c4", align: "center", useTooltip: true },
  ],
  tableData: [
    { c0: "-", c1: "-", c2: "-", c3: "-", c4: "-" },
    { c0: "-", c1: "-", c2: "-", c3: "-", c4: "-" },
  ],
});
</script>

<style lang="scss" scoped>
.detail-family-members {
}
</style>
