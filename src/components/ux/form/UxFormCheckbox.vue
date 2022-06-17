<template>
  <el-checkbox-group v-model="current">
    <el-checkbox v-for="(config, i) in options" :key="i" v-bind="config" />
  </el-checkbox-group>
</template>

<script lang="ts" setup>
/**
 * 表单数据交互控件-多选框
 * @version 0.0.1
 * @document https://element-plus.gitee.io/zh-CN/component/checkbox.html
 */

import { ref, watch } from "vue";

interface IProps {
  config: Ux.FormItemConfig;
  model: { [propName: string]: any };
  setModel: (key: string, value: any) => void;
}

/**
 * @props
 */
const props = withDefaults(defineProps<IProps>(), {
  config: () => ({} as Ux.FormItemConfig),
  model: () => ({}),
  setModel: () => {},
});

const current = ref([]);
const options = ref([]);

watch(
  () => props.config.field,
  () => {
    current.value = props.model[props.config.field];
  },
  { deep: true, immediate: true },
);

watch(
  () => props.model,
  () => {
    current.value = props.model[props.config.field];
  },
  { deep: true, immediate: true },
);

watch(
  () => props.config.componentProps,
  (componentProps) => {
    if (!componentProps) {
      return;
    }
    // ? 选项列表
    if (componentProps.options) {
      options.value = componentProps.options;
    }
  },
  { deep: true, immediate: true },
);

watch(
  () => current.value,
  () => {
    if (props.setModel) {
      props.setModel(props.config.field, current.value);
    }
  },
  { deep: true, immediate: true },
);
</script>

<style lang="scss" scoped></style>
