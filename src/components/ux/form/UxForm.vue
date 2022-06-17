<template>
  <div class="ux-form">
    <el-form ref="elFormRef" :model="form.model" v-loading="loading">
      <el-row type="flex" v-bind="props.layout">
        <template v-for="(config, i) in form.items" :key="i">
          <el-col v-bind="config.colProps" v-show="isShow(config)">
            <el-form-item :label="config.label" :prop="config.field" :rules="config.rules" :label-width="config.labelWidth">
              <!-- 渲染方式①：动态slot -->
              <slot :name="config.slotName" v-if="config.slotName"></slot>
              <!-- 渲染方式②：动态组件 -->
              <component
                :is="getComponent(config.component)"
                :config="config"
                :model="form.model"
                :set-model="setModel"
                v-else-if="config.component"
              ></component>
              <!-- 渲染方式③：异常提示 -->
              <UxFormErrorTip v-else />
            </el-form-item>
          </el-col>
        </template>
        <el-col v-if="!props.hideFooter">
          <slot name="reset" :model="form.model">
            <el-button @click="onReset">重置</el-button>
          </slot>
          <slot name="submit" :model="form.model">
            <el-button type="primary" @click="onSubmit">确定</el-button>
          </slot>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
/**
 * 动态表单
 * @version 0.0.3
 * @description 配置式表单、提供常用数据交互控件、也可通过动态插槽自行定制。
 * ---
 * 内置插槽
 * @slot reset 重置按钮
 * @slot submit 提交按钮
 */

import { ref, reactive, watch } from "vue";
import UxFormErrorTip from "@/components/ux/form/UxFormErrorTip.vue";
import UxFormInput from "@/components/ux/form/UxFormInput.vue";
import UxFormInputNumber from "@/components/ux/form/UxFormInputNumber.vue";
import UxFormSelect from "@/components/ux/form/UxFormSelect.vue";
import UxFormCascader from "@/components/ux/form/UxFormCascader.vue";
import UxFormDatePicker from "@/components/ux/form/UxFormDatePicker.vue";
import UxFormSwitch from "@/components/ux/form/UxFormSwitch.vue";
import UxFormCheckbox from "@/components/ux/form/UxFormCheckbox.vue";
import UxFormColorPicker from "@/components/ux/form/UxFormColorPicker.vue";
import UxFormRate from "@/components/ux/form/UxFormRate.vue";
import UxFormSlider from "@/components/ux/form/UxFormSlider.vue";

// ? 定制组件
const components: { [propsName: string]: any } = {
  Input: UxFormInput,
  InputNumber: UxFormInputNumber,
  Select: UxFormSelect,
  Cascader: UxFormCascader,
  DatePicker: UxFormDatePicker,
  Switch: UxFormSwitch,
  Checkbox: UxFormCheckbox,
  ColorPicker: UxFormColorPicker,
  Rate: UxFormRate,
  Slider: UxFormSlider,
};

interface IProps {
  /**
   * 表单结构配置
   */
  config: Array<Ux.FormItemConfig>;
  /**
   * 表单数据
   */
  model: { [propName: string]: any };
  /**
   * 栅格布局 row 配置
   * @document https://element-plus.gitee.io/zh-CN/component/layout.html#row-%E5%B1%9E%E6%80%A7
   */
  layout?: { [propName: string]: any };
  /**
   * 是否隐藏底部按钮控件
   */
  hideFooter?: boolean;
}

/**
 * @props
 */
const props = withDefaults(defineProps<IProps>(), {
  layout: () => ({}),
  model: () => ({}),
  config: () => [],
  hideFooter: false,
});

/**
 * @events
 */
const emit = defineEmits(["submit"]);

const elFormRef = ref();
const form = reactive<{ model: { [propName: string]: any }; items: Array<Ux.FormItemConfig> }>({
  model: {},
  items: [],
});
const loading = ref(false);

watch(
  () => props.model,
  (model) => {
    form.model = model;
  },
  { deep: true, immediate: true },
);

watch(
  () => props.config,
  (formItemsConfig) => {
    form.items = formItemsConfig as Array<Ux.FormItemConfig>;
  },
  { deep: true, immediate: true },
);

/**
 * @public
 */
defineExpose({
  resetForm,
});

function getComponent(name: string) {
  return components[name] || UxFormErrorTip;
}

/**
 * 子组件通过该方法操作表单model
 */
function setModel(key: string, value: any) {
  form.model[key] = value;
}

function onReset() {
  resetForm();
}

function onSubmit() {
  // 验证表单
  elFormRef.value.validate((isValid: boolean) => {
    if (isValid) {
      loading.value = true;
      emit("submit", { ...form.model }, () => {
        loading.value = false;
      });
    }
  });
}

function isShow(config: Ux.FormItemConfig) {
  // ? 默认显示
  if (typeof config.show === "undefined") {
    return true;
  }
  // TODO 开启权限判断
  return config.show;
}

function resetForm() {
  elFormRef.value.resetFields(); // 重置表单
}
</script>

<style lang="scss" scoped>
.ux-form {
}
</style>
