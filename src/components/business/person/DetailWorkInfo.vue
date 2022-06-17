<template>
  <ul>
    <li v-for="(item, i) in workInfoFromArray" :key="i">
      <span class="label">{{ item.label }}</span>
      <span class="value">{{ item.value }}</span>
    </li>
  </ul>
</template>

<script lang="ts" setup>
// 任职信息
const workInfoFromArray = ref([
  { label: "编制工作单位", value: "-" },
  { label: "编制职位", value: "-" },
  { label: "人员类别", value: "-" },
  { label: "任职时间", value: "-" },
  { label: "编制类型", value: "-" },
  { label: "经费形式", value: "-" },
  { label: "岗位标签", value: "-" },
  { label: "工作地址", value: "-" },
  { label: "所属部门", value: "-" },
  { label: "工作内容", value: "-" },
]);
</script>

<style lang="scss" scoped>
ul {
  padding: 15px 10px 10px 18px;
  border: 1px solid #f4f4f4;
  li {
    margin-bottom: 10px;
    display: flex;
    font-size: 14px;
    .label {
      flex: 0 0 124px;
      color: #9da7b3;
    }
    .value {
      color: #454b5b;
    }
  }
}
</style>
