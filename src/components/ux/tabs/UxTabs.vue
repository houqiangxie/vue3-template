<template>
  <div class="ux-tabs">
    <div class="tabs-header">
      <el-radio-group class="ux-dark-el-radio" v-model="currentRadioLabel" @change="onRadioChange">
        <el-radio-button v-for="(item, i) in props.config" :key="i" :label="String(i)">{{ item.label }}</el-radio-button>
      </el-radio-group>
    </div>
    <div class="tabs-pane">
      <el-tabs class="ux-dark-el-tabs" v-model="tabsActiveName">
        <el-tab-pane v-for="(item, i) in props.config" :key="i" :name="String(i)">
          <slot :name="item.slotName" :activeIndex="i">{{ item.label }}</slot>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * tabs
 * @version 0.0.1
 */

import { ref, watch } from "vue";

interface IProps {
  config: Array<{ label: string; slotName: string }>;
  activeIndex?: number;
}

/**
 * @props
 */
const props = withDefaults(defineProps<IProps>(), {
  config: () => [],
  activeIndex: 0,
});

/**
 * @events
 */
const emit = defineEmits(["change"]);

const currentRadioLabel = ref("");
const tabsActiveName = ref("");

watch(
  () => props.activeIndex,
  () => {
    const current = String(props.activeIndex);
    currentRadioLabel.value = current;
    tabsActiveName.value = current;
  },
  { deep: true, immediate: true },
);

function onRadioChange(current: string) {
  tabsActiveName.value = current;
  const activeIndex = Number.parseInt(current);
  emit("change", activeIndex);
}
</script>

<style lang="scss" scoped>
.ux-tabs {
  & > .tabs-header {
    :deep(.ux-dark-el-radio) {
      .is-active,
      .is-focus {
        span {
          color: #ffffff;
          border-color: #0151da;
          background-color: #0151da;
        }
      }
      span {
        padding: 9px 12px;
        font-size: 16px;
        font-family: SourceHanSansCN-Regular, SourceHanSansCN;
        font-weight: 400;
        color: #0151da;
        border-color: #0151da !important;
        background: #fff;
      }
    }
  }
  & > .tabs-pane {
    :deep(.ux-dark-el-tabs) {
      .el-tabs__header {
        display: none;
      }
    }
  }
}
</style>
