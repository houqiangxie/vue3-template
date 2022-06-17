<template>
  <el-select v-model="current" v-bind="getComponentProps()" v-on="getComponentEvents()">
    <el-option v-for="(option, i) in options" :key="i" v-bind="option" />
  </el-select>
</template>

<script lang="ts" setup>
/**
 * 表单数据交互控件-下拉列表
 * @version 0.0.1
 * @document https://element-plus.gitee.io/zh-CN/component/select.html
 * ---
 * 组件内部扩展属性
 * @props setOptions 远程搜索方法 `() => Promise<Array<any>>`
 */

import { ref, reactive, watch } from "vue";

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

const current = ref();
const options = ref([]);

const innerSelectProps = reactive({
  loading: false,
  remote: false,
  filterable: false,
  "remote-method": (v: string) => {
    innerSelectProps.loading = true;
    if (props.config.componentProps && props.config.componentProps.setOptions) {
      const promise = props.config.componentProps.setOptions() as Promise<any>;
      promise
        .then((nextOptions) => {
          options.value = nextOptions;
        })
        .finally(() => {
          innerSelectProps.loading = false;
        });
    }
  },
});

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
    // ? 是否开启远程搜索
    if (componentProps.setOptions) {
      innerSelectProps.remote = true;
      innerSelectProps.filterable = true;
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

function getComponentProps() {
  return { ...props.config.componentProps, ...innerSelectProps };
}

function getComponentEvents() {
  return { ...props.config.componentEvents };
}
</script>

<style lang="scss" scoped></style>
