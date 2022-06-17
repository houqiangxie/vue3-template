<template>
  <div class="ux-table-wrap">
    <el-table class="ux-el-table" ref="table" v-bind="$attrs">
      <slot></slot>
    </el-table>
  </div>
</template>

<script lang="ts" setup>
/**
 * 基于 el-table 组件进行二次封装
 * @version 0.0.2
 * @description 统一样式
 * @document https://element-plus.gitee.io/zh-CN/component/table.html
 */

import { ref } from "vue";

const table = ref(null);

/**
 * @public
 */
defineExpose({
  getTableMethods,
});

function getTableMethods() {
  return table.value;
}
</script>

<style lang="scss" scoped>
$borderColor: #e0e0e0;
.ux-table-wrap {
  :deep(.ux-el-table) {
    border: 1px solid $borderColor;
    border-bottom: none;
    // ? 表格底部1px边框
    .el-table__inner-wrapper::before {
      background-color: $borderColor;
    }
    tr {
      border-color: $borderColor;
      // background-color: #f9f9f9;
      th {
        background-color: #f9f9f9;
        .cell {
          font-size: 16px;
          font-weight: bold;
          color: #454b5b;
        }
      }
    }
    tr {
      td {
        border-color: $borderColor;
        .cell {
          font-size: 14px;
          font-weight: 400;
          color: #454b5b;
        }
      }
    }
  }
}
</style>
