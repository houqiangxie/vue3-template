<template>
  <div class="ux-tree-filter">
    <el-input class="ux-dark-el-input" v-model="treeConfig.keyword" placeholder="请输入" v-if="props.showFilter" />
    <el-tree
      ref="treeRef"
      class="ux-dark-el-tree"
      :data="treeConfig.data"
      :props="treeConfig.props"
      default-expand-all
      :filter-node-method="filterNode"
    />
  </div>
</template>

<script lang="ts" setup>
/**
 * 树形过滤器
 * @version 0.0.2
 */

import { ref, reactive, watch } from "vue";

interface IProps {
  showFilter?: boolean;
}

/**
 * @props
 */
const props = withDefaults(defineProps<IProps>(), {
  showFilter: false,
});

const treeRef = ref(null);
const treeConfig = reactive({
  keyword: null,
  props: {
    label: "label",
    children: "children",
  },
  // TODO
  data: [
    {
      id: 1,
      label: "一级 1",
      children: [
        {
          id: 4,
          label: "二级 1-1",
          children: [
            {
              id: 9,
              label: "三级 1-1-1",
              children: [
                {
                  id: 9,
                  label: "1-1-1-1-1-1-1-1-1-1-1-1",
                  children: [
                    {
                      id: 9,
                      label: "测试文本测试文本测试文本测试文本测试文本测试文本",
                    },
                  ],
                },
              ],
            },
            {
              id: 10,
              label: "三级 1-1-2",
            },
          ],
        },
      ],
    },
    {
      id: 2,
      label: "一级 2",
      children: [
        {
          id: 5,
          label: "二级 2-1",
        },
        {
          id: 6,
          label: "二级 2-2",
        },
      ],
    },
    {
      id: 3,
      label: "一级 3",
      children: [
        {
          id: 7,
          label: "二级 3-1",
        },
        {
          id: 8,
          label: "二级 3-2",
        },
      ],
    },
    {
      id: 3,
      label: "一级 3",
      children: [
        {
          id: 7,
          label: "二级 3-1",
        },
        {
          id: 8,
          label: "二级 3-2",
        },
      ],
    },
    {
      id: 3,
      label: "一级 3",
      children: [
        {
          id: 7,
          label: "二级 3-1",
        },
        {
          id: 8,
          label: "二级 3-2",
        },
      ],
    },
    {
      id: 3,
      label: "一级 3",
      children: [
        {
          id: 7,
          label: "二级 3-1",
        },
        {
          id: 8,
          label: "二级 3-2",
        },
      ],
    },
    {
      id: 3,
      label: "一级 3",
      children: [
        {
          id: 7,
          label: "二级 3-1",
        },
        {
          id: 8,
          label: "二级 3-2",
        },
      ],
    },
  ],
});

watch(
  () => treeConfig.keyword,
  (v) => {
    (treeRef.value as any)?.filter(v);
  },
  { deep: true, immediate: true },
);

function filterNode(value: string, data: { [propName: string]: any }) {
  if (!value) {
    return true;
  }
  return data.label.indexOf(value) !== -1;
}
</script>

<style lang="scss" scoped>
@import "@/components/ux/common/styles/el-dark.scss";
.ux-tree-filter {
  overflow: auto;
  height: 100%;
}
</style>
