<template>
  <div class="ux-panel" :style="props.style">
    <div class="header">
      <slot name="header">{{ props.title }}</slot>
    </div>
    <slot></slot>
    <div class="close" @click="onClose">
      <i></i>
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * 面板：统一样式，有关闭按钮。
 * @version 0.0.1
 */

interface IProps {
  title?: string;
  style?: { [propName: string]: any };
}

/**
 * @props
 */
const props = withDefaults(defineProps<IProps>(), {
  title: "标题",
  style: () => ({}),
});

/**
 * @events
 */
const emit = defineEmits(["close"]);

function onClose() {
  emit("close");
}
</script>

<style lang="scss" scoped>
.ux-panel {
  position: relative;
  padding-top: 50px;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  background: #ffffff;
  border-radius: 10px;
  & > .header {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 0 20px;
    box-sizing: border-box;
    width: 100%;
    height: 50px;
    font-size: 16px;
    font-weight: bold;
    color: #454b5b;
    border-bottom: 1px solid #f4f4f4;
  }
  & > .close {
    position: absolute;
    right: 8px;
    top: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: content-box;
    padding: 5px;
    width: 24px;
    height: 24px;
    font-size: 24px;
    color: #939393;
    cursor: pointer;
    // border: 1px solid red;
    i {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      font-style: normal;
      border-radius: 50%;
      border: 2px solid #ffffff;
      &::before {
        content: "×";
        position: absolute;
        top: calc(50% - 2px);
        left: 50%;
        transform: translate(-50%, -50%);
      }
    }
  }
}
</style>
