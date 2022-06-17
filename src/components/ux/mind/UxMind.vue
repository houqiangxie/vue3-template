<template>
  <div class="ux-mind-container" ref="containerRef">
    <div class="ux-mind-main" ref="mainRef">
      <svg version="1.1">
        <polyline v-for="(polyline, i) in graph.polylines" :key="`polyline_${i}`" :points="polyline.points" :style="getPolylineStyle(polyline)" />
      </svg>
      <div v-bind="{ 'data-ux-mind-tag': 'root-box' }">
        <template v-for="(root, i) in rootList" :key="i">
          <div v-bind="{ 'data-ux-mind-tag': 'root', 'data-ux-mind-root-id': i }" :style="root.style" @click="rootToggleExpand(root, i)">
            {{ root.name }}
          </div>
          <div v-bind="{ 'data-ux-mind-tag': 'children', 'data-ux-mind-root-id': i }" v-if="root.nodeInfo && root.nodeInfo.expand">
            <UxMindTreeNode
              v-for="(node, j) in root.children"
              :key="j"
              :ref="(el) => setRefList(el, j)"
              :node="node"
              :root-id="i"
              @expand-change="(isExpand: boolean) => onExpandChange(isExpand, i, node, root.children)"
              @root-click="onRootClick"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * 树形图
 * @version 0.0.1
 */

import { ref, reactive, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { TreeUtil, MindUtil, ExtendUtil } from "@/common/utils";
import UxMindTreeNode from "./UxMindTreeNode.vue";

interface IProps {
  config: Ux.MindConfig;
}

/**
 * @props
 */
const props = withDefaults(defineProps<IProps>(), {
  config: () => ({
    rootLayout: [],
    rootList: [],
  }),
});

/**
 * @events
 */
const emit = defineEmits(["change", "scroll"]);

/**
 * @state
 */
const containerRef = ref<HTMLElement>();
const mainRef = ref<HTMLElement>();
// 图形数据集
const graph = reactive({
  polylines: [] as Array<{ id: number; points: string }>,
});
// 根节点布局
const rootLayout = ref<Array<any>>([]);
// 根节点列表
const rootList = ref<Array<any>>([]);
// 子节点相对根节点的偏移量
const childOffsetList: Array<Array<{ x: number; y: number }>> = [];
const childRefList = ref<Array<any>>([]);

/**
 * @hook
 */
onMounted(() => {
  toCenter();
  on();
});

/**
 * @hook
 */
onBeforeUnmount(() => {
  off();
});

/**
 * @watch
 */
watch(
  () => props.config,
  () => {
    rootLayout.value = ExtendUtil.deepCopy(props.config.rootLayout);
    rootList.value = ExtendUtil.deepCopy(props.config.rootList);
    nextTick(() => {
      setRootPosition();
    });
  },
  { deep: true },
);

/**
 * 初始化视图居中
 */
function toCenter() {
  const containerDOMRect = MindUtil.getDOMRect(getContainerDOM());
  const mainDOMRect = MindUtil.getDOMRect(getMainDOM());
  getContainerDOM().scrollTo((mainDOMRect.width - containerDOMRect.width) / 2, (mainDOMRect.height - containerDOMRect.height) / 2);
}

/**
 * 设置根节点定位
 */
function setRootPosition() {
  rootList.value.forEach((root: any, i) => {
    // ? 注入节点信息、子节点展开状态
    TreeUtil.each(root, (node) => {
      node.nodeInfo.expand = false;
    });
    root.style = rootLayout.value[i].style; // ? 设置[根节点]分布（目前为固定位置，会出现重叠）
  });
  nextTick(() => {
    // 所有根节点水平居中处理
    const mainDOMRect = MindUtil.getDOMRect(getMainDOM());
    getRootDOMList().forEach((childDOM, i) => {
      const childDOMRect = MindUtil.getDOMRect(childDOM);
      // ? style.left 水平居中
      rootList.value[i].style.left = `calc(50% - ${childDOMRect.width / 2}px)`;
      // ? style.top %换算成px
      let top = 0;
      if (childDOM.style.top.includes("%")) {
        top = Number.parseFloat(childDOM.style.top.slice(0, -1)) * 0.01 * mainDOMRect.height;
      }
      rootList.value[i].style.top = top + "px";
    });
    // 获取下一级子节点的定位
    getNextChildPosition();
  });
}

/**
 * 根节点挂载后动态计算下一级子节点的定位
 */
function getNextChildPosition() {
  rootList.value.forEach((root, i) => {
    childOffsetList[i] = [];
    const childLayout = MindUtil.getChildLayout(rootLayout.value[i].layoutType, getMainDOM(), getRootDOM(i), root.children.length); // TODO 当前非动态计算
    root.children.forEach((node: any, j: number) => {
      if (childLayout[j].style) {
        node.style = childLayout[j].style;
      }
      childOffsetList[i].push(childLayout[j].offset);
    });
  });
}

/**
 * 设置下一级子节点的定位
 */
function setNextChildPosition(rootId: number) {
  const mainDOMRect = MindUtil.getDOMRect(getMainDOM());
  const rootDOMRect = MindUtil.getDOMRect(getRootDOM(rootId));
  const offsetList = childOffsetList[rootId];
  getGroupDOMList(rootId).forEach((childDOM, i) => {
    let left = rootDOMRect.center.x - mainDOMRect.x + offsetList[i].x;
    let top = rootDOMRect.center.y - mainDOMRect.y + offsetList[i].y;
    const childDOMRect = MindUtil.getDOMRect(childDOM);
    top = top - childDOMRect.height / 2;
    const tDOMRect = MindUtil.getDOMRect(getTDOM(childDOM));
    // 左侧
    if (childDOM.style.direction === "rtl") {
      left = left - childDOMRect.width + tDOMRect.width / 2;
    } else {
      left = left - tDOMRect.width / 2;
    }
    childDOM.style.left = left + "px";
    childDOM.style.top = top + "px";
  });
}

/**
 * 绘制连接线
 */
function drawLine(rootId: number) {
  graph.polylines = graph.polylines.filter(({ id }) => id !== rootId); // 根据标记过滤

  nextTick(() => {
    const parentDOMRect = MindUtil.getDOMRect(getMainDOM());
    const rootDOMRect = MindUtil.getDOMRect(getRootDOM(rootId));
    const start = {
      x: rootDOMRect.center.x - parentDOMRect.x,
      y: rootDOMRect.center.y - parentDOMRect.y,
    };
    getGroupDOMList(rootId).forEach((groupDOM) => {
      const groupDOMRect = MindUtil.getDOMRect(groupDOM);
      const tDOMRect = MindUtil.getDOMRect(getTDOM(groupDOM));
      const end = groupDOMRect.center;
      if (groupDOMRect.center.x > rootDOMRect.center.x) {
        end.x = end.x - parentDOMRect.x - groupDOMRect.width / 2 + tDOMRect.width / 2;
      } else {
        end.x = end.x - parentDOMRect.x + groupDOMRect.width / 2 - tDOMRect.width / 2;
      }
      end.y = end.y - parentDOMRect.y;
      graph.polylines.push({
        id: rootId, // 标记
        points: MindUtil.getSVGPolylinePoints(start, end),
      });
    });
  });
}

/**
 * 获取连接线样式
 */
function getPolylineStyle(polyline: any) {
  const colors = ["#0151da", "#32b16c", "#eaa843"];
  return {
    fill: "transparent",
    stroke: colors[polyline.id || 0], // 线段颜色
    "stroke-width": 2,
  };
}

/**
 * 事件绑定
 */
function on() {
  window.addEventListener("resize", onResize);

  getContainerDOM().addEventListener("scroll", onScroll);
}

/**
 * 解除事件绑定
 */
function off() {
  window.removeEventListener("resize", onResize);

  getContainerDOM().removeEventListener("scroll", onScroll);
}

/**
 * 窗口大小变化时处理函数
 */
function onResize() {
  rootList.value.forEach((root, i) => {
    setNextChildPosition(i);
    drawLine(i);
  });
}

/**
 * 节点滚动事件处理函数
 */
function onScroll() {
  emit("scroll");
}

/**
 * 子节点展开状态变化时触发
 */
function onExpandChange(isExpand: boolean, rootId: number, currentNode: UxCore.TreeNode, peerLevelNodeList: Array<UxCore.TreeNode>) {
  // ? 控制根节点的下一级子节点的子节点展开状态，只能有二级节点可展开下级
  if (currentNode.nodeInfo.level === 2 && isExpand) {
    peerLevelNodeList.forEach((item) => {
      if (item.name === currentNode.name) {
        item.nodeInfo.expand = isExpand;
      } else {
        item.nodeInfo.expand = !isExpand;
      }
      // ? 下一级子节点线段重绘
      childRefList.value.forEach((childIns) => {
        childIns.drawLine && childIns.drawLine();
      });
    });
  }

  nextTick(() => {
    setNextChildPosition(rootId);
    drawLine(rootId);
    mutex(rootId);
    emit("change");
  });
}

/**
 * 冒泡：告知当前点击的节点
 */
function onRootClick(node: UxCore.TreeNode) {
  console.log("node", node);
}

/**
 * 点击当前根节点切换展开子节点的展开状态
 */
function rootToggleExpand(root: any, rootId: number) {
  const nextExpand = !root.nodeInfo.expand;
  root.nodeInfo.expand = nextExpand;
  nextTick(() => {
    setNextChildPosition(rootId);
    drawLine(rootId);
    mutex(rootId);
    emit("change");
  });
}

interface IBoundary {
  id: number;
  x: number;
  y: number;
  x1: number;
  y1: number;
  width: number;
  height: number;
}

/**
 * 批量设置子组件实例
 */
function setRefList(el: any, i: number) {
  childRefList.value = [];
  nextTick(() => {
    if (el) {
      childRefList.value[i] = el;
    }
  });
}

/**
 * TODO 节点互斥
 */
function mutex(currentRootId: number) {
  const boundaryList: Array<IBoundary> = [];

  rootList.value.forEach((root, i) => {
    const rootId = i;
    // 下一级子节点列表
    const childList = getGroupDOMList(rootId);
    // 边界信息
    const boundary = {
      id: i, // 关联id
      x: Infinity, // 起点x（左上角）
      y: Infinity, // 起点y（左上角）
      x1: -Infinity, // 终点x（右下角）
      y1: -Infinity, // 终点y（右下角）
      width: 0, // 终点x-起点x
      height: 0, // 终点y-起点y
    };

    // 先记录根节点的边界
    const rootDOMRect = MindUtil.getDOMRect(getRootDOM(rootId));
    boundary.x = rootDOMRect.x;
    boundary.y = rootDOMRect.y;
    boundary.x1 = rootDOMRect.x + rootDOMRect.width;
    boundary.y1 = rootDOMRect.y + rootDOMRect.height;
    boundary.width = rootDOMRect.width;
    boundary.height = rootDOMRect.height;

    // 子节点被展开时，边界可能会发生改变
    if (childList.length > 0) {
      // 子节点的边界试探
      childList.forEach((childDOM, i) => {
        const childDOMRect = MindUtil.getDOMRect(childDOM);
        boundary.x = Math.min(boundary.x, childDOMRect.x);
        boundary.y = Math.min(boundary.y, childDOMRect.y);
        boundary.x1 = Math.max(boundary.x1, childDOMRect.x + childDOMRect.width);
        boundary.y1 = Math.max(boundary.y1, childDOMRect.y + childDOMRect.height);
      });
      boundary.width = boundary.x1 - boundary.x;
      boundary.height = boundary.y1 - boundary.y;
    }

    boundaryList.push(boundary);
  });

  // console.log("boundaryList", boundaryList);

  /**
   * TODO 边界根据y值进行位置排序
   */
  // boundaryList.sort();

  // ? 以当前下标为中心向左右两边进行遍历 ←|→
  const leftSide = boundaryList.slice(0, currentRootId).reverse(); // 反转
  const rightSide = boundaryList.slice(currentRootId + 1);
  const len = Math.max(leftSide.length, rightSide.length);
  const gapY = 50; // 根节点的默认间隔暂定为50

  /**
   * ? left 往上顶：遍历当前项获取下方节点边界，并向上移动规避碰撞。
   */
  for (let i = 0, l = len; i < l; i++) {
    if (leftSide[i]) {
      const current = leftSide[i];
      const findIndex = boundaryList.findIndex((item) => item.id === current.id);
      const next = boundaryList[findIndex + 1];
      const rootDOM = getRootDOM(current.id);
      const top = +rootDOM.style.top.replace("px", "");
      const distance = next.y - current.y1;
      // console.log("--- 往上顶 left START", current.id, next.id);
      if (distance < 0) {
        // console.log(">>边界碰撞", distance);
        const nextTop = top + distance - gapY;
        // console.log(">>>>", "top", top, "nextTop", nextTop);
        rootList.value[current.id].style.top = nextTop + "px"; // 规避碰撞
        // 更新操作后的边界
        boundaryList[findIndex].y = boundaryList[findIndex].y + distance - gapY;
        boundaryList[findIndex].y1 = boundaryList[findIndex].y1 + distance - gapY;
        nextTick(() => {
          onResize();
        });
      } else {
        // console.log(">>边界不碰撞", distance);
        if (distance !== gapY) {
          const nextTop = top + distance - (i + 1) * gapY;
          // console.log(">>>>回归合理间隔:", "top", top, "nextTop", nextTop);
          rootList.value[current.id].style.top = nextTop + "px"; // 回归合理间距
          // 更新操作后的边界
          boundaryList[findIndex].y = boundaryList[findIndex].y + distance - (i + 1) * gapY;
          boundaryList[findIndex].y1 = boundaryList[findIndex].y1 + distance - (i + 1) * gapY;
          nextTick(() => {
            onResize();
          });
        }
      }
    }
  }

  /**
   * ? right 往下踩：遍历当前项获取上方节点边界，并向下移动规避碰撞。
   */
  for (let i = 0, l = len; i < l; i++) {
    if (rightSide[i]) {
      const current = rightSide[i];
      const findIndex = boundaryList.findIndex((item) => item.id === current.id);
      const prev = boundaryList[findIndex - 1];
      const rootDOM = getRootDOM(current.id);
      const top = +rootDOM.style.top.replace("px", "");
      const distance = current.y - prev.y1;
      // console.log("--- 往下踩 right START", current.id, prev.id);
      if (distance < 0) {
        // console.log(">>边界碰撞", distance);
        const nextTop = top - distance + gapY;
        rootList.value[current.id].style.top = nextTop + "px"; // 规避碰撞
        // 更新操作后的边界
        boundaryList[findIndex].y = boundaryList[findIndex].y + Math.abs(distance) + gapY;
        boundaryList[findIndex].y1 = boundaryList[findIndex].y1 + Math.abs(distance) + gapY;
        nextTick(() => {
          onResize();
        });
      } else {
        if (distance !== gapY) {
          // console.log(">>边界不碰撞", distance);
          const nextTop = top - (distance - gapY);
          rootList.value[current.id].style.top = nextTop + "px"; // 回归合理间距
          // 更新操作后的边界
          boundaryList[findIndex].y = boundaryList[findIndex].y - (distance - gapY);
          boundaryList[findIndex].y1 = boundaryList[findIndex].y1 - (distance - gapY);
          nextTick(() => {
            onResize();
          });
        }
      }
    }
  }
}

/**
 * 获取容器节点
 * @DOM
 */
function getContainerDOM() {
  return containerRef.value as HTMLElement;
}

/**
 * 获取核心节点
 * @DOM
 */
function getMainDOM() {
  return mainRef.value as HTMLElement;
}

/**
 * 获取指定根节点
 * @DOM
 */
function getRootDOM(rootId: number) {
  return getMainDOM().querySelector(`[data-ux-mind-tag="root"][data-ux-mind-root-id="${rootId}"]`) as HTMLElement;
}

/**
 * 获取根节点列表
 * @DOM
 */
function getRootDOMList(): NodeListOf<HTMLElement> {
  return getMainDOM().querySelectorAll(`[data-ux-mind-tag="root-box"] > [data-ux-mind-tag="root"]`);
}

/**
 * 获取group节点
 * @DOM
 */
function getGroupDOMList(rootId: number) {
  return getMainDOM().querySelectorAll(
    `[data-ux-mind-tag="root-box"] > [data-ux-mind-tag="children"][data-ux-mind-root-id="${rootId}"] > [data-ux-mind-tag="group"]`,
  ) as NodeListOf<HTMLElement>;
}

/**
 * 获取name容器节点
 * @DOM
 */
function getTDOM(el: HTMLElement) {
  return el.querySelector(`[data-ux-mind-tag="t"]`) as HTMLElement;
}
</script>

<style lang="scss" scoped>
.ux-mind-container {
  width: 100%;
  height: 100%;
  user-select: none;
  overflow: scroll;
  .ux-mind-main {
    position: relative;
    width: 3000px;
    height: 2000px;
    // width: 100%;
    // height: 100%;
    transition: all 0.3s;
    user-select: none;
    // background: #f6f6f6;
    & > svg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    & > div[data-ux-mind-tag="root-box"] {
      position: relative;
      box-sizing: border-box;
      height: 100%;
      & > div[data-ux-mind-tag="root"] {
        position: absolute;
        padding: 5px 10px;
        // top: calc(50%);
        // left: calc(50%);
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        line-height: 20px;
        font-size: 14px;
        font-weight: bold;
        white-space: pre-wrap;
        border-radius: 10px;
        color: rgba(1, 81, 218, 1);
        border: 2px solid rgba(1, 81, 218, 1);
        background-color: #cfdcf5;
        cursor: pointer;
      }
      & > div[data-ux-mind-tag="children"] {
        position: absolute;
        top: 0;
        left: 0;
        display: inline-block;
        & > :deep(div[data-ux-mind-tag="group"]) {
          position: absolute;
          // border: 1px solid red;
        }
      }
    }
  }
}
</style>
