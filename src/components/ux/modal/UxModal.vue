<template>
  <el-dialog
    custom-class="ux-body-modal"
    v-model="modal.isShow"
    top="15vh"
    destroy-on-close
    :modal="true"
    :show-close="false"
    :close-on-click-modal="false"
    v-bind="$attrs"
  >
    <!-- 插槽最好传入组件，避免使用全局样式 -->
    <slot></slot>
  </el-dialog>
</template>

<script lang="ts" setup>
/**
 * 公共弹层
 * @version 0.0.1
 */

import { reactive, watch } from "vue";

interface IProps {
  value?: boolean;
  toBody?: boolean;
}

/**
 * @props
 */
const props = withDefaults(defineProps<IProps>(), {
  value: false,
  toBody: false,
});

/**
 * @events
 */
const emit = defineEmits(["input"]);

const modal = reactive({
  isShow: false,
  style: {},
});

const mask = reactive({
  style: {},
});

watch(
  () => props.value,
  (isShow) => {
    modal.isShow = isShow;
  },
  { deep: true, immediate: true },
);

function onClose() {
  modal.isShow = false;
  emit("input", false);
}
</script>

<style lang="scss">
.el-dialog.ux-body-modal {
  box-shadow: none;
  background-color: transparent;
  .el-dialog__header {
    display: none;
  }
  .el-dialog__body {
    padding: 0;
    display: flex;
    justify-content: center;
  }
}
</style>
