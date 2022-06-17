<template>
  <div class="detail-base-info">
    <div class="layout-left">
      <img src="" alt="" />
    </div>
    <div class="layout-right">
      <div class="name">
        <span>NAME</span>
        <i class="on">在职</i>
      </div>
      <ul>
        <li v-for="(item, i) in baseInfoFromArray" :key="i">
          <span class="label">{{ item.label }}</span>
          <span class="value">{{ item.value }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
// 基本信息
const baseInfoFromArray = ref([
  { label: "民族", value: "-" },
  { label: "所属处室", value: "-" },
  { label: "身份证号", value: "-" },
  { label: "户口所在地", value: "-" },
  { label: "学历学位", value: "-" },
  { label: "性别", value: "-" },
  { label: "职务", value: "-" },
  { label: "籍贯", value: "-" },
  { label: "政治面貌", value: "-" },
  { label: "专业", value: "-" },
  { label: "年龄", value: "-" },
  { label: "序号", value: "-" },
  { label: "出生地", value: "-" },
  { label: "婚姻状态", value: "-" },
  { label: "参与工作时间", value: "-" },
]);
</script>

<style lang="scss" scoped>
.detail-base-info {
  position: relative;
  padding-left: 240px;
  box-sizing: border-box;
  // height: 235px;
  background: #f4f4f4;
  .layout-left {
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    overflow: hidden;
    width: 160px;
    height: 195px;
    background-color: #ccc;
    img {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      height: 100%;
    }
  }
  .layout-right {
    padding: 20px 0;
    box-sizing: border-box;
    .name {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      span {
        font-size: 24px;
        font-family: Microsoft YaHei;
        font-weight: bold;
        line-height: 24px;
        color: #454b5b;
      }
      i {
        margin-left: 15px;
        padding: 2px 3px;
        line-height: 14px;
        font-style: normal;
        font-size: 14px;
        border-radius: 4px;
        color: #0151da;
        border: 1px solid #0151da;
        background: rgba(1, 81, 218, 0.2);
      }
    }
    ul {
      padding-top: 10px;
      display: flex;
      flex-wrap: wrap;
      li {
        margin-top: 38px;
        padding-right: 10px;
        box-sizing: border-box;
        flex: 1 1 20%;
        font-size: 14px;
        line-height: 18px;
        .label {
          display: inline-block;
          min-width: 110px;
          color: #9da7b3;
        }
        .value {
          display: inline-block;
          color: #454b5b;
        }
      }
    }
  }
}
</style>
