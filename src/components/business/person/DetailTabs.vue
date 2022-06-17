<template>
  <div class="detail-tabs">
    <UxTabs class="tabs" :config="tabsConfig" :activeIndex="0" @change="onTabsChange">
      <template #part1>
        <UxTimeline class="timeline" :config="timeline"></UxTimeline>
        <div class="layout">
          <div class="layout-left">
            <h4 class="title">荣誉档案</h4>
            <UxTable :data="honorRecord.tableData">
              <UxTableColumn v-for="(col, i) in honorRecord.tableColumns" :key="i" :config="col"></UxTableColumn>
            </UxTable>
          </div>
          <div class="layout-right">
            <h4 class="title">清单信息</h4>
            <UxTable :data="honorInventoryInfo.tableData">
              <UxTableColumn v-for="(col, i) in honorInventoryInfo.tableColumns" :key="i" :config="col"></UxTableColumn>
            </UxTable>
          </div>
        </div>
      </template>
      <template #part2>
        <UxTable :data="trainExp.tableData">
          <UxTableColumn v-for="(col, i) in trainExp.tableColumns" :key="i" :config="col"></UxTableColumn>
        </UxTable>
      </template>
      <template #part3>
        <UxTable :data="checkResult.tableData">
          <UxTableColumn v-for="(col, i) in checkResult.tableColumns" :key="i" :config="col"></UxTableColumn>
        </UxTable>
      </template>
      <template #part4>
        <div class="layout">
          <div class="layout-left">
            <h4 class="title">惩戒档案</h4>
            <UxTable :data="punishRecord.tableData">
              <UxTableColumn v-for="(col, i) in punishRecord.tableColumns" :key="i" :config="col"></UxTableColumn>
            </UxTable>
          </div>
          <div class="layout-right">
            <h4 class="title">清单信息</h4>
            <UxTable :data="punishInventoryInfo.tableData">
              <UxTableColumn v-for="(col, i) in punishInventoryInfo.tableColumns" :key="i" :config="col"></UxTableColumn>
            </UxTable>
          </div>
        </div>
      </template>
    </UxTabs>
    <div class="ctrl">
      <template v-if="tabsActiveIndex === 0">
        <el-button type="primary">录入</el-button>
        <el-button type="primary">编辑</el-button>
      </template>
      <template v-else-if="tabsActiveIndex === 1">
        <label>年份</label>
        <el-date-picker type="year"></el-date-picker>
      </template>
      <template v-else-if="tabsActiveIndex === 2">
        <label>年份</label>
        <el-date-picker type="year"></el-date-picker>
        <el-date-picker type="year"></el-date-picker>
      </template>
      <template v-else-if="tabsActiveIndex === 3"></template>
    </div>
  </div>
</template>

<script lang="ts" setup>
const tabsActiveIndex = ref(0);
const tabsConfig = ref([
  {
    label: "荣誉表彰",
    slotName: "part1",
  },
  {
    label: "培训经历",
    slotName: "part2",
  },
  {
    label: "考核结果",
    slotName: "part3",
  },
  {
    label: "负面清单",
    slotName: "part4",
  },
]);

// 时间线
const timeline = ref([
  { type: "info", time: "2022至今", content: "0测试文本测试文本测试文本测试文本测试文本测试文本测试文本" },
  { type: "info", time: "YYYY-MM-DD", content: ["1测试文本", "1-1测试文本测试文本测试文本测试文本", "1-1-1测试文本测试文本测试文本"] },
  { type: "nothing", time: "YYYY-MM-DD", content: ["2测试文本测试文本测试文本测试文本测试文本测试文本测试文本"] },
  { type: "info", time: "YYYY-MM-DD", content: ["3测试文本测试文本测试文本测试文本测试文本测试文本测试文本"] },
  { type: "info", time: "YYYY-MM-DD", content: ["4测试文本测试文本测试文本测试文本测试文本测试文本测试文本"] },
  { type: "info", time: "YYYY-MM-DD", content: ["5测试文本测试文本测试文本测试文本测试文本测试文本测试文本"] },
  { type: "info", time: "YYYY-MM-DD", content: ["6测试文本测试文本测试文本测试文本测试文本测试文本测试文本"] },
  { type: "info", time: "YYYY-MM-DD", content: ["7测试文本测试文本测试文本测试文本测试文本测试文本测试文本"] },
  { type: "info", time: "YYYY-MM-DD", content: ["8测试文本测试文本测试文本测试文本测试文本测试文本测试文本"] },
  { type: "info", time: "YYYY-MM-DD", content: ["9测试文本测试文本测试文本测试文本测试文本测试文本测试文本"] },
]);

// 荣誉档案
const honorRecord = ref({
  tableColumns: [
    { label: "序号", prop: "c0", align: "center" },
    { label: "名称", prop: "c1", align: "center", useTooltip: true },
    { label: "次数", prop: "c2", align: "center", useTooltip: true },
  ],
  tableData: [
    { c0: "-", c1: "-", c2: "-" },
    { c0: "-", c1: "-", c2: "-" },
  ],
});

// 荣誉档案-清单信息
const honorInventoryInfo = reactive({
  tableColumns: [
    { label: "序号", prop: "c0", align: "center" },
    { label: "类别", prop: "c1", align: "center", useTooltip: true },
    { label: "处理结果", prop: "c2", align: "center", useTooltip: true },
    { label: "简要情况", prop: "c3", align: "center", useTooltip: true },
    { label: "时间", prop: "c4", align: "center", useTooltip: true },
  ],
  tableData: [
    { c0: "-", c1: "-", c2: "-", c3: "-", c4: "-" },
    { c0: "-", c1: "-", c2: "-", c3: "-", c4: "-" },
  ],
});

// 培训经历
const trainExp = reactive({
  tableColumns: [
    { label: "序号", prop: "c0", align: "center" },
    { label: "培训课程", prop: "c1", align: "center", useTooltip: true },
    { label: "培训时长", prop: "c2", align: "center", useTooltip: true },
    { label: "参与培训日期", prop: "c3", align: "center", useTooltip: true },
  ],
  tableData: [
    { c0: "-", c1: "-", c2: "-", c3: "-" },
    { c0: "-", c1: "-", c2: "-", c3: "-" },
  ],
});

// 考核结果
const checkResult = reactive({
  tableColumns: [
    { label: "序号", prop: "c0", align: "center" },
    { label: "年份", prop: "c1", align: "center", useTooltip: true },
    { label: "考核结果", prop: "c2", align: "center", useTooltip: true },
  ],
  tableData: [
    { c0: "-", c1: "-", c2: "-" },
    { c0: "-", c1: "-", c2: "-" },
  ],
});

// 惩戒档案
const punishRecord = reactive({
  tableColumns: [
    { label: "序号", prop: "c0", align: "center" },
    { label: "名称", prop: "c1", align: "center", useTooltip: true },
    { label: "次数", prop: "c2", align: "center", useTooltip: true },
  ],
  tableData: [
    { c0: "-", c1: "-", c2: "-" },
    { c0: "-", c1: "-", c2: "-" },
  ],
});

// 惩戒档案-清单信息
const punishInventoryInfo = reactive({
  tableColumns: [
    { label: "序号", prop: "c0", align: "center" },
    { label: "类别", prop: "c1", align: "center", useTooltip: true },
    { label: "处理结果", prop: "c2", align: "center", useTooltip: true },
    { label: "简要情况", prop: "c3", align: "center", useTooltip: true },
    { label: "时间", prop: "c4", align: "center", useTooltip: true },
  ],
  tableData: [
    { c0: "-", c1: "-", c2: "-", c3: "-", c4: "-" },
    { c0: "-", c1: "-", c2: "-", c3: "-", c4: "-" },
  ],
});

function onTabsChange(activeIndex: number) {
  tabsActiveIndex.value = activeIndex;
}
</script>

<style lang="scss" scoped>
.detail-tabs {
  :deep(.tabs) {
    .tabs-header {
      padding: 20px;
      border-bottom: 1px solid #f4f4f4;
    }
    .tabs-pane {
      padding: 20px;
      padding-bottom: 50px;
    }
    .timeline {
      margin-bottom: 30px;
    }
    .layout {
      overflow-x: auto;
      display: flex;
      h4.title {
        margin-bottom: 15px;
        height: 20px;
        line-height: 20px;
      }
      .layout-left {
        flex: 1 1;
      }
      .layout-right {
        margin-left: 20px;
        flex: 1 1;
      }
    }
  }
  & > .ctrl {
    position: absolute;
    top: 25px;
    right: 20px;
    z-index: 1;
    label {
      margin-right: 10px;
      color: #454b5b;
    }
  }
}
</style>
