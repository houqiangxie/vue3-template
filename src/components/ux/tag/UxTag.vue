<template>
  <span class="ux-tag" :class="{ closable }" :style="style" @click="onClick">
    <span class="bg" :style="{ backgroundColor: props.color }"></span>
    <span class="label" :style="labelStyle">
      <slot></slot>
    </span>
    <i class="close" :style="closeStyle" @click="onClose" v-if="closable" />
  </span>
</template>

<script lang="ts" setup>
/**
 * 标签
 * @version 0.0.1
 */

import { reactive } from "vue";

interface IProps {
  width?: string;
  color?: string;
  closable?: boolean;
  dashed?: boolean;
  pointer?: boolean;
}

/**
 * @props
 */
const props = withDefaults(defineProps<IProps>(), {
  width: "auto",
  color: "rgba(1, 81, 218, 1)",
  closable: false,
  dashed: false,
  pointer: false,
});

/**
 * @events
 */
const emit = defineEmits(["close", "click"]);

const style = reactive({
  width: props.width,
  backgroundColor: `rgba($color: ${props.color}, $alpha: 0.1)`,
  borderColor: props.color,
  borderStyle: props.dashed ? "dashed" : "solid",
  cursor: props.pointer ? "pointer" : "auto",
});

const labelStyle = reactive({
  color: props.color,
});

const closeStyle = reactive({
  color: props.color,
  borderColor: props.color,
});

function onClick() {
  emit("click");
}

function onClose() {
  emit("close");
}
</script>

<style lang="scss" scoped>
$color: rgba(1, 81, 218, 1);
.ux-tag {
  position: relative;
  display: inline-block;
  padding: 5px 15px;
  text-align: center;
  border-radius: 4px;
  border: 1px solid $color;
  &.closable {
    padding: 5px 30px 5px 10px;
  }
  & > .bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0.1;
  }
  & > .label {
    color: $color;
    font-size: 16px;
    line-height: 16px;
  }
  & > .close {
    position: absolute;
    top: 50%;
    right: 10px;
    transform: translateY(-50%);
    width: 15px;
    height: 15px;
    font-style: normal;
    border-radius: 50%;
    cursor: pointer;
    color: red;
    border: 1px solid red;
    &::after {
      content: "×";
      position: absolute;
      top: calc(50% - 1px);
      left: 50%;
      line-height: 10px;
      transform: translate(-50%, -50%);
    }
    &:hover {
      color: #fff !important;
      border-color: #666 !important;
      background-color: #666 !important;
    }
  }
}
</style>
