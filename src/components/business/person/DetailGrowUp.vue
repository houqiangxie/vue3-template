<template>
  <div class="detail-grow-up">
    <UxTimeline :config="growUpTimeline"></UxTimeline>
  </div>
</template>

<script lang="ts" setup>
// 成长经历
const growUpTimeline = ref([
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
</script>

<style lang="scss" scoped></style>
