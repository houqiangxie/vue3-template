<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2024-07-18 15:38:28
 * @LastEditors: houqiangxie
 * @LastEditTime: 2024-07-19 10:17:43
-->
<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue';
import { useBoxSize, useBoxGrid } from './drag';
const file = import.meta.glob('/src/moduleComponents/**/*.vue',{eager:false});
const componentObj = {}
Object.keys(file).forEach((key) => {
  const name = key.replace(/\/src\/moduleComponents(.*)?\/|\.vue/g, '');
  componentObj[name] = file[key];
})
const props = withDefaults(
  defineProps<{
    /** 数据源 */
    data: DragItemData[];
    /** 列 */
    column?: number;
    /** 行 */
    row?: number;
    /** 间隔 */
    gap?: number;
    /** 容器圆角 */
    borderRadius?: string;
  }>(),
  {
    column: 0,
    row: 0,
    gap: 0,
    borderRadius: '6px',
  }
);

const previewLayoutRef = ref<HTMLElement>();

const { columnCount, rowCount } = useBoxGrid(
  computed(() => props.data),
  props.column,
  props.row
);

const boxSize = useBoxSize(
  previewLayoutRef,
  props.column,
  props.row,
  props.gap
);

const getPreviewStyle = ({ x, y, row, column }: DragItemData) => {
  return {
    // grid 下标从 1 开始, 需要 + 1
    'grid-area': `${y + 1} / ${x + 1} / ${y + row + 1}/ ${x + column + 1}`,
  };
};
</script>

<template>
  <div ref="previewLayoutRef" class="preview-layout">
    <div class="preview-layout__container">
      <div
        v-for="(item, i) in data"
        class="preview-layout__item"
        :key="`${item.key}${i}`"
        :style="getPreviewStyle(item)"
      >
        <component
          style="width: 100%; height: 100%"
          :is="defineAsyncComponent(componentObj[item.key])"
          :data="item"
        />
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.preview-layout {
  height: 100%;
  width: 100%;
  position: relative;
  overflow-y: auto;

  &__container {
    display: grid;
    row-gap: v-bind("gap+'px'");
    column-gap: v-bind("gap+'px'");
    grid-template-columns: repeat(
      v-bind('columnCount'),
      v-bind("boxSize.width+'px'")
    );
    grid-template-rows: repeat(
      v-bind('rowCount'),
      v-bind("boxSize.height+'px'")
    );
  }

  &__item {
    border-radius: v-bind('borderRadius');
    overflow: hidden;
    // box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
}
</style>
