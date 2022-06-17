<template>
  <el-cascader v-model="current" v-bind="getComponentProps()" @change="onChange" v-on="getComponentEvents()" />
</template>

<script lang="ts" setup>
/**
 * 表单数据交互控件-级联选择器
 * @version 0.0.1
 * @document https://element-plus.gitee.io/zh-CN/component/cascader.html
 */

import { ref, watch, withDefaults } from "vue";

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

const current = ref({});

watch(
  () => props.config.field,
  () => {
    current.value = props.model[props.config.field] || [];
  },
  { deep: true, immediate: true },
);

watch(
  () => props.model,
  () => {
    current.value = props.model[props.config.field] || [];
  },
  { deep: true, immediate: true },
);

function getComponentProps() {
  return { ...props.config.componentProps };
}

function getComponentEvents() {
  return { ...props.config.componentEvents };
}

function onChange(v: { [propName: string]: any }) {
  if (props.setModel) {
    props.setModel(props.config.field, Object.values(v || {}));
  }
}
</script>

<style lang="scss" scoped></style>
