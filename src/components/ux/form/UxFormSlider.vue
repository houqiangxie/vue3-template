<template>
  <el-slider v-model="current" v-bind="getComponentProps()" v-on="getComponentEvents()" />
</template>

<script lang="ts" setup>
/**
 * 表单数据交互控件-滑块
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

const current = ref(0);

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
  () => current.value,
  () => {
    if (props.setModel) {
      props.setModel(props.config.field, current.value);
    }
  },
  { deep: true, immediate: true },
);

function getComponentProps() {
  return { ...props.config.componentProps };
}

function getComponentEvents() {
  return { ...props.config.componentEvents };
}
</script>

<style lang="scss" scoped></style>
