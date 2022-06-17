<template>
  <div class="ux-relation" ref="wrapRef">
    <!-- 画连接线 -->
    <svg version="1.1">
      <polyline v-for="(polyline, i) in graph.polylines" :key="`polyline_${i}`" :points="polyline.points" :style="getPolylineStyle(polyline)" />
    </svg>
    <!-- 画圆 -->
    <div class="circle" v-for="(circle, i) in graph.circles" :key="`circle_${i}`" v-bind="{ 'data-ux-relation-circle': i }" :style="circle.style">
      <span class="text">{{ circle.text }}</span>
    </div>
    <!-- 画树形 -->
    <div class="ux-mind">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * 关系图
 * @version 0.0.1
 */

import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from "vue";
import { MindUtil } from "@/common/utils";

const wrapRef = ref<HTMLElement>();

interface IGraph {
  polylines: Array<any>;
  circles: Array<any>;
}

const graph = reactive<IGraph>({
  polylines: [],
  circles: [],
});

const wrapSize = reactive({
  width: 0,
  height: 0,
});

onMounted(() => {
  init();
  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
});

defineExpose({
  init,
});

function init() {
  const parent = wrapRef.value as HTMLElement;
  const parentLayoutInfo = parent.getBoundingClientRect();
  wrapSize.width = parentLayoutInfo.width;
  wrapSize.height = parentLayoutInfo.height;
  drawCircles();
  drawLine();
  nextTick(() => {
    // console.log("---circle---");
    // console.log("parent", parentLayoutInfo);
    graph.circles.forEach((item, i) => {
      // if (i !== 0) {
      //   return;
      // }
      const circle = parent.querySelector(`[data-ux-relation-circle="${i}"]`) as HTMLElement;
      const circleLayoutInfo = MindUtil.getDOMRect(circle);
      const circleText = circle.querySelector(".text")?.innerHTML as string;
      console.log("circleText", circleText);
      // const circleCenter = RelationUtil.getDomCenter(circle);
      // console.log("center", circleCenter);
      const childList: NodeListOf<HTMLElement> = parent.querySelectorAll(`[data-ux-mind-tag="t-name"]`);
      childList.forEach((child, i) => {
        if (child.innerHTML !== circleText) {
          return;
        }
        const childLayoutInfo = child.getBoundingClientRect();
        // console.log("---");
        // console.log("child", child.innerHTML, childLayoutInfo, child);
        const start = {
          x: circleLayoutInfo.x + circleLayoutInfo.width / 2,
          y: circleLayoutInfo.y + circleLayoutInfo.height / 2,
        };
        const end = {
          x: childLayoutInfo.x + childLayoutInfo.width / 2,
          y: childLayoutInfo.y + childLayoutInfo.height / 2,
        };
        // 子节点在左侧
        if (start.x - end.x > 0) {
          // TODO
        } else {
          // TODO
        }
        start.x = start.x - parentLayoutInfo.x;
        start.y = start.y - parentLayoutInfo.y;
        end.x = end.x - parentLayoutInfo.x;
        end.y = end.y - parentLayoutInfo.y;
        graph.polylines.push({
          // id: i,
          points: MindUtil.getSVGPolylinePoints(start, end),
        });
      });
    });
  });
}

function drawCircles() {
  graph.circles = [
    {
      text: "干部队伍",
      style: { width: "160px", height: "160px", left: 10 + "px", top: 10 + "px", backgroundColor: "#3273f4" },
    },
    {
      text: "综合行政执法队伍",
      style: { width: "160px", height: "160px", left: -10 + wrapSize.width - 160 + "px", top: 10 + "px", backgroundColor: "#3273f4" },
    },
    {
      text: "防灾减灾救灾队伍",
      style: { width: "160px", height: "160px", left: 10 + "px", top: wrapSize.height - 160 + "px", backgroundColor: "#3273f4" },
    },
    {
      text: "应急救援队伍",
      style: {
        width: "160px",
        height: "160px",
        left: -10 + wrapSize.width - 160 + "px",
        top: -10 + wrapSize.height - 160 + "px",
        backgroundColor: "#3273f4",
      },
    },
  ];
}

function drawLine() {
  graph.polylines = [];
}

function onResize() {
  init();
}

function getPolylineStyle(polyline: any) {
  const colors = ["#0151da", "#32b16c", "#eaa843"];
  const style = {
    fill: "transparent",
    stroke: colors[polyline.id || 0], // TODO
    "stroke-width": 2,
  };
  return style;
}
</script>

<style lang="scss" scoped>
.ux-relation {
  position: relative;
  height: 100%;
  // border: 1px solid red;
  svg {
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .text {
    color: #fff;
  }
  .circle,
  .rect,
  .round-rect {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    z-index: 2;
    top: 0;
    left: 0;
    cursor: pointer;
    // opacity: 0.2;
    &:hover {
      box-shadow: 0px 0px 18px 0px rgba(0, 0, 0, 0.38);
    }
  }
  .circle {
    border-radius: 50%;
    cursor: pointer;
  }
  .tree {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  .ux-mind {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  :deep(.ux-mind) {
    .ux-mind-main {
      div[data-ux-mind-tag="root-box"] {
        & > div[data-ux-mind-tag="root"][data-ux-mind-root-id="0"] {
          width: 145px;
          height: 50px;
          color: #0151da;
          border: 2px solid #0151da;
          background-color: #cfdcf5;
        }
        & > div[data-ux-mind-tag="root"][data-ux-mind-root-id="1"] {
          width: 145px;
          height: 50px;
          color: #32b16c;
          border: 2px solid #32b16c;
          background-color: #dbeee3;
        }
        & > div[data-ux-mind-tag="root"][data-ux-mind-root-id="2"] {
          color: #eaa843;
          border: 2px solid #eaa843;
          background-color: #f9eedb;
        }
        & > div[data-ux-mind-tag="children"][data-ux-mind-root-id="1"] {
          & > div[data-ux-mind-tag="group"] {
            & > div[data-ux-mind-tag="t"] {
              & > div[data-ux-mind-tag="t-name"] {
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 0;
                width: 60px;
                height: 60px;
                line-height: 16px;
                font-size: 12px;
                border-radius: 50%;
                white-space: pre-wrap;
                color: #32b16c;
                border: 2px solid #32b16c;
                background-color: #dbeee3;
              }
            }
            div[data-ux-mind-tag="group"] {
              div[data-ux-mind-tag="t-name"] {
                color: #32b16c;
                border: 2px solid #32b16c;
                background-color: #dbeee3;
              }
            }
          }
        }
        & > div[data-ux-mind-tag="children"][data-ux-mind-root-id="2"] {
          & > div[data-ux-mind-tag="group"] {
            & > div[data-ux-mind-tag="t"] {
              & > div[data-ux-mind-tag="t-name"] {
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 12px 14px;
                width: 120px;
                height: 60px;
                line-height: 18px;
                font-size: 14px;
                white-space: pre-wrap;
                color: #eaa843;
                border: 2px solid #eaa843;
                background-color: #f9eedb;
              }
              div[data-ux-mind-tag="group"] {
                div[data-ux-mind-tag="t-name"] {
                  color: #eaa843;
                  border: 2px solid #eaa843;
                  background-color: #f9eedb;
                }
              }
            }
          }
        }
      }
    }
  }
}
</style>
