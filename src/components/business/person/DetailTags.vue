<template>
  <div class="detail-tags">
    <UxTag v-for="(item, i) in tags" :key="i" :color="item.color" :closable="item.closable">{{ item.label }}</UxTag>
    <UxTag color="rgba(157, 167, 179, 1)" width="176px" dashed pointer @click="onClick"> + 标签</UxTag>
    <UxModal v-model="modal.isShow">
      <UxPanel title="Title" @close="modal.isShow = false">
        <template #header>
          <div class="modal-header">
            <span>标题</span>
            <UxTag color="rgba(1, 81, 218, 1)">编辑</UxTag>
          </div>
        </template>
        <div class="content-box">
          <UxForm :model="form.model" :config="form.config" :layout="form.layout" @submit="onSubmit"></UxForm>
        </div>
      </UxPanel>
    </UxModal>
  </div>
</template>

<script lang="ts" setup>
import { UxTag, UxModal, UxPanel, UxForm } from "@/components/ux";

const tags = ref([
  { color: "rgba(1, 81, 218, 1)", closable: false, label: "标签1" },
  { color: "rgba(50, 177, 108, 1)", closable: false, label: "标签2" },
  { color: "rgba(221, 81, 81, 1)", closable: false, label: "标签3" },
  { color: "rgba(157, 167, 179, 1)", closable: false, label: "标签4" },
]);

const modal = reactive({
  isShow: false,
});

interface IForm {
  layout: { [propName: string]: any };
  model: { [propsName: string]: any };
  config: Array<Ux.FormItemConfig>;
}

const form = reactive<IForm>({
  layout: { gutter: 10 },
  model: {
    A: "",
    B: "#ff0000",
  },
  config: [
    {
      component: "Input",
      label: "文本",
      colProps: { span: 24 },
      field: "A",
      rules: [{ type: "string", required: true }],
      componentProps: {
        clearable: true,
      },
    },
    {
      component: "ColorPicker",
      label: "取色器",
      colProps: { span: 12 },
      field: "B",
      componentProps: {
        predefine: ["rgba(1, 81, 218, 1)", "rgba(50, 177, 108, 1)", "rgba(221, 81, 81, 1)", "rgba(157, 167, 179, 1)"],
      },
    },
  ],
});

function onClick() {
  form.model.A = "标签1";
  modal.isShow = true;
}

function onSubmit(model: any, hideLoading: any) {
  console.log("model", model);
  setTimeout(() => {
    hideLoading();
  }, 1000);
}
</script>

<style lang="scss" scoped>
.detail-tags {
  span {
    margin-right: 20px;
    margin-bottom: 15px;
  }
  .modal-header {
    // color: red;
  }
  .content-box {
    padding: 20px;
  }
}
</style>
