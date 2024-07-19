<script setup lang="ts">
import { computed, ref } from 'vue';
import { dragStore } from './drag';

const emits = defineEmits(['close', 'resize-start', 'resizeing', 'resize-end']);

const props = withDefaults(
  defineProps<{
    /** 元素放置信息 */
    data: DragItemData;
    /** 拖拽分组标识 */
    groupName?: string;
    resize?: 'none' | 'both' | 'vertical' | 'horizontal';
  }>(),
  {
    groupName: 'DrapDrop',
    resize: 'none',
  }
);

const moveing = ref(false);
const resizeing = ref(false);

const previewStyle = computed(() => {
  return {
    'grid-area': `${props.data.y + 1} / ${props.data.x + 1} / ${
      props.data.y + props.data.row + 1
    }/ ${props.data.x + props.data.column + 1}`,
    ...(moveing.value
      ? {
          opacity: 0,
          // 将当前元素移出容器外,将元素占位空置出来
          transform: `translate(-999999999px, -9999999999px)`,
        }
      : {}),
    ...(resizeing.value ? { opacity: 0.5 } : {}),
  };
});

const onDragstart = (e) => {
  const data = props.data;
  data.offsetX = e.offsetX;
  data.offsetY = e.offsetY;
  dragStore.set(props.groupName, data);
  // 拖拽开始立刻设置 opacity: 0 会导致拖拽默认样式也会为 opacity: 0 , 需要延迟设置
  setTimeout(() => (moveing.value = true));
  unset(e.target);
};

const onDragend = (e) => {
  moveing.value = false;
  dragStore.remove(props.groupName);
};

const onMousedown = (e) => {
  dragStore.set(props.groupName, props.data);
  emits('resize-start');
  resizeing.value = true;

  e.target.onmousemove = function (event) {
    emits('resizeing', {
      width: event.target.offsetWidth,
      height: event.target.offsetHeight,
    });
  };

  e.target.onmouseup = function (event) {
    unset(event.target);
    emits('resize-end');
    event.target.style.width = '100%';
    event.target.style.height = '100%';
    dragStore.remove(props.groupName);
  };
};

const unset = (target) => {
  resizeing.value = false;
  target.onmousemove = null;
  target.onmouseup = null;
};
</script>

<template>
  <div
    class="preview-item"
    :style="previewStyle"
    draggable="true"
    @dragstart="onDragstart"
    @dragend="onDragend"
    @mousedown="onMousedown"
  >
    <slot>
      <div class="preview-item__default"></div>
    </slot>
    <slot name="close">
      <div
        class="close-btn"
        :size="20"
        @click.stop.prevent="$emit('close')"
      ></div>
    </slot>
  </div>
</template>
<style lang="scss" scoped>
.preview-item {
  position: relative;
  box-sizing: border-box;
  overflow: hidden;
  pointer-events: all;
  opacity: 1;
  user-select: none;
  overflow: auto;
  resize: v-bind(resize);

  &__default {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: red;
    user-select: none;
    box-sizing: border-box;
    border-radius: 6px;
    background-color: #efefef;
    border: 2px solid #2c68f325;
    &:hover {
      border-color: #2c68f399;
      transition: all 0.2s;
    }
  }

  &__move {
    position: absolute;
    cursor: nwse-resize;
    right: 0;
    bottom: 0;
    width: 20px;
    height: 20px;
    background: red;
  }

  .close-btn {
    position: absolute;
    cursor: pointer;
    right: 4px;
    top: 4px;
    height: 20px;
    width: 20px;

    &:after,
    &:before {
      content: '';
      background: #666;
      width: 16px;
      height: 2px;
      margin: auto;
      position: absolute;
      top: 0;
      bottom: 0;
      right: 0;
      left: 0;
    }
    &:before {
      transform: rotate(-225deg);
      top: 0;
    }
    &:after {
      transform: rotate(225deg);
      top: 0;
    }
  }
}
</style>
