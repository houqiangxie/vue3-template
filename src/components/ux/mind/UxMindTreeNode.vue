<template>
  <div v-bind="{ 'data-ux-mind-tag': 'group' }" ref="groupRef" :style="getGroupStyle(node)">
    <svg version="1.1">
      <polyline v-for="(polyline, i) in graph.polylines" :key="`polyline_${i}`" :points="polyline.points" :style="getPolylineStyle()" />
    </svg>
    <div v-bind="{ 'data-ux-mind-tag': 't' }" class="bar" ref="rootRef" :style="getTStyle(node)">
      <div v-bind="{ 'data-ux-mind-tag': 't-name' }" @click="rootToggleExpand(node)">{{ node.name }}</div>
    </div>
    <div v-bind="{ 'data-ux-mind-tag': 'children', 'data-ux-mind-tag-id': UUID }" v-if="isExpand(node)">
      <UxRelationTreeNode
        v-for="(item, i) in node.children"
        :key="i"
        :ref="(el) => setRefList(el, i)"
        :node="item"
        :root-id="props.rootId"
        @expand-change="onExpandChange"
        @root-click="onRootClick"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * 树形图-递归组件
 * @version 0.0.1
 */

import { ref, reactive, watch, nextTick, onMounted } from "vue";
import { ExtendUtil, MindUtil } from "@/common/utils";

interface IProps {
  node: UxCore.TreeNode;
  rootId: number;
}

/**
 * @props
 */
const props = withDefaults(defineProps<IProps>(), {
  node: () => ({}),
  rootId: 0,
});

/**
 * @events
 */
const emit = defineEmits(["expand-change", "root-click"]);

/**
 * @state
 */
const graph = reactive<{ polylines: Array<any> }>({
  polylines: [],
});
const node = ref({});
const UUID = ref("");
const groupRef = ref<HTMLElement>();
const rootRef = ref<HTMLElement>();
const dragStatus = ref("disable");
const childRefList = ref<Array<any>>([]);

/**
 * @hook
 */
onMounted(() => {
  UUID.value = ExtendUtil.uuid();
  drawLine();
});

/**
 * @watch
 */
watch(
  () => props.node,
  () => {
    node.value = props.node;
    if (props.node.nodeInfo.level === 2) {
      dragStatus.value = "proxy";
    }
  },
  { deep: true, immediate: true },
);

/**
 * @public
 */
defineExpose({
  drawLine,
});

/**
 * 获取当前容器节点样式
 */
function getGroupStyle(node: UxCore.TreeNode) {
  return node.style || {};
}

/**
 * 获取连接线样式
 */
function getPolylineStyle() {
  const colors = ["#0151da", "#32b16c", "#eaa843"];
  return {
    fill: "transparent",
    stroke: colors[props.rootId], // 线段颜色
    "stroke-width": 2,
  };
}

/**
 * 获取名称节点样式
 */
function getTStyle(node: UxCore.TreeNode) {
  if ((node.nodeInfo as UxCore.TreeNodeInfo).level === 2) {
    return {
      margin: "0",
    };
  }
  return {};
}

/**
 * 子节点是否展开
 */
function isExpand(node: UxCore.TreeNode) {
  return node.children && node.children.length > 0 && node.nodeInfo.expand;
}

/**
 * 子节点展开状态变化时触发
 */
function onExpandChange(isExpand: boolean) {
  drawLine();
  emit("expand-change", isExpand);
  // ? 下一级子节点线段重绘
  childRefList.value.forEach((childIns) => {
    childIns.drawLine && childIns.drawLine();
  });
}

/**
 * 冒泡：告知当前点击的节点
 */
function onRootClick(node: UxCore.TreeNode) {
  emit("root-click", node);
}

/**
 * 点击当前根节点切换展开子节点的展开状态
 */
function rootToggleExpand(node: UxCore.TreeNode) {
  node.nodeInfo.expand = !node.nodeInfo.expand;
  nextTick(() => {
    drawLine();
    emit("expand-change", node.nodeInfo.expand);
    emit("root-click", node);
  });
}

/**
 * 绘制连接线
 */
function drawLine() {
  graph.polylines = [];
  nextTick(() => {
    const parentDOM = getGroupDOM();
    const parentDOMRect = MindUtil.getDOMRect(parentDOM);
    const childDOMList = getTDOMList(UUID.value);
    const rootDOMRect = MindUtil.getDOMRect(rootRef.value as HTMLElement);
    childDOMList.forEach((child) => {
      const childDOMRect = MindUtil.getDOMRect(child);
      const start = { ...rootDOMRect.center };
      const end = childDOMRect.center;
      // 子节点在左侧
      if (start.x - end.x > 0) {
        start.x = start.x - rootDOMRect.width / 2;
        end.x = end.x + childDOMRect.width / 2;
      } else {
        start.x = start.x + rootDOMRect.width / 2;
        end.x = end.x - childDOMRect.width / 2;
      }
      // 起点和终点需要进行换算
      start.x = Math.abs(parentDOMRect.x - start.x);
      start.y = Math.abs(parentDOMRect.y - start.y);
      end.x = Math.abs(parentDOMRect.x - end.x);
      end.y = Math.abs(parentDOMRect.y - end.y);
      graph.polylines.push({
        points: MindUtil.getSVGPolylinePoints(start, end, []), // [] 可添加转折点
      });
    });
  });
}

/**
 * 批量设置子组件实例
 */
function setRefList(el: any, i: number) {
  if (el) {
    childRefList.value[i] = el;
  }
}

/**
 * 获取group节点
 * @DOM
 */
function getGroupDOM() {
  return groupRef.value as HTMLElement;
}

/**
 * 获取下一级name容器节点列表
 * @DOM
 */
function getTDOMList(uuid: string) {
  return getGroupDOM().querySelectorAll(
    `[data-ux-mind-tag-id="${uuid}"] > [data-ux-mind-tag="group"] > [data-ux-mind-tag="t"]`,
  ) as NodeListOf<HTMLElement>;
}
</script>

<script lang="ts">
import { defineComponent } from "vue";

/**
 * @description 递归组件需要定义组件名
 */
export default defineComponent({
  name: "UxRelationTreeNode",
});
</script>

<style lang="scss" scoped>
div[data-ux-mind-tag="group"] {
  position: relative;
  display: flex;
  // border: 1px solid red;
  & > div[data-ux-mind-tag="t"] {
    position: relative;
    z-index: 1;
    margin: 10px 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 28px;
    white-space: nowrap;
    box-sizing: border-box;
    & > div[data-ux-mind-tag="t-name"] {
      padding: 5px 10px;
      box-sizing: border-box;
      line-height: 20px;
      font-size: 14px;
      text-align: center;
      border-radius: 10px;
      color: rgba(1, 81, 218, 1);
      border: 2px solid rgba(1, 81, 218, 1);
      background-color: #cfdcf5;
      cursor: pointer;
      // min-width: 80px;
      // white-space: pre-wrap;
    }
  }
  & > div[data-ux-mind-tag="children"] {
    display: flex;
    flex-direction: column;
  }
  & > svg {
    position: absolute;
    width: 100%;
    height: 100%;
  }
}
</style>
