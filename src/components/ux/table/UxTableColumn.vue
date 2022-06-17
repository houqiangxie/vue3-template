<template>
  <!-- 具有 element type 属性的特殊处理 -->
  <el-table-column v-bind="config" v-if="config.type" />
  <el-table-column v-bind="config" v-else>
    <template #default="{ row }">
      <!-- 渲染方式①：动态slot -->
      <slot :name="config.slotName" :row="row" v-if="config.slotName"></slot>
      <!-- 渲染方式②：带tooltip的文本 -->
      <el-tooltip
        popper-class="ux-dark-el-tooltip"
        effect="dark"
        placement="top"
        :content="String(row[config.prop as string])"
        :show-after="300"
        :disabled="!config.useTooltip"
        v-else
      >
        <div class="text" :style="{ '-webkit-line-clamp': config.textRowLimit || 1 }">{{ row[config.prop as string] }}</div>
      </el-tooltip>
    </template>
  </el-table-column>
</template>

<script lang="ts" setup>
/**
 * 基于 element el-table-column 组件进行二次封装
 * @version 0.0.1
 * @description 可自定义插槽、文本溢出隐藏使用tooltip显示等。
 */

interface IProps {
  config: Ux.TableColumnConfig;
}

withDefaults(defineProps<IProps>(), {
  config: () => ({}),
});
</script>

<style lang="scss" scoped></style>
