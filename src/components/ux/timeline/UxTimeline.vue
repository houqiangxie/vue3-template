<template>
  <div class="ux-timeline">
    <div class="arrow left" @click="onArrowClick('left')"></div>
    <div class="container" ref="container">
      <div class="wrapper">
        <div class="node">
          <div class="time"></div>
        </div>
        <div v-for="(item, i) in props.config" :key="i" class="node" :class="{ nothing: item.type === 'nothing' }">
          <div class="time">
            <p>{{ item.time }}</p>
          </div>
          <div class="line"></div>
          <div class="content">
            <p v-if="typeof item.content === 'string'">{{ item.content }}</p>
            <p v-for="(jtem, j) in item.content" :key="j" v-else-if="Array.isArray(item.content)">{{ jtem }}</p>
          </div>
        </div>
      </div>
    </div>
    <div class="arrow right" @click="onArrowClick('right')"></div>
  </div>
</template>

<script lang="ts" setup>
/**
 * 时间轴
 * @version 0.0.2
 */

import { ref, withDefaults } from "vue";

interface IConfig {
  type: string | "info" | "nothing";
  time: string;
  content: string | Array<string>;
}

interface IProps {
  config: Array<IConfig>;
}

/**
 * @props
 */
const props = withDefaults(defineProps<IProps>(), {
  config: () => [],
});

const container = ref<HTMLElement>();

function getContainer() {
  return container.value as HTMLElement;
}

function onArrowClick(type: "left" | "right") {
  let direction = -1;
  if (type === "right") {
    direction = 1;
  }
  scrollTo(direction);
}

function scrollTo(direction: number) {
  getContainer().scrollTo({
    left: 200 * direction + getContainer().scrollLeft,
    top: 0,
    behavior: "smooth",
  });
}
</script>

<style lang="scss" scoped>
.ux-timeline {
  display: flex;
  justify-content: center;
  position: relative;
  width: 100%;
  min-height: 100px;
  // border: 1px solid red;
  & > .container {
    flex: 1 1;
    overflow-y: auto;
    & > .wrapper {
      display: flex;
      padding-top: 60px;
      padding-bottom: 30px;
      & > .node {
        flex: 0 0 200px;
        & > .time {
          position: relative;
          padding-left: 30px;
          height: 14px;
          color: #0151da;
          &::before {
            position: absolute;
            left: 0;
            top: 50%;
            transform: translate(0, -50%);
            content: "";
            box-sizing: border-box;
            width: 14px;
            height: 14px;
            background: #ffffff;
            border: 2px solid #325bde;
            border-radius: 50%;
          }
          &::after {
            position: absolute;
            top: 6px;
            left: 25px;
            content: "";
            width: calc(100% - 20px - 15px);
            height: 1px;
            background: #9da7b3;
          }
          & > p {
            position: absolute;
            top: -30px;
            left: -60px + 10px;
            width: 120px;
            text-align: center;
          }
        }
        & > .line {
          margin-left: 6px;
          margin-top: 10px;
          margin-bottom: 10px;
          width: 1px;
          height: 80px;
          background: #9da7b3;
        }
        & > .content {
          position: relative;
          padding-left: 30px;
          padding-right: 30px;
          &::before {
            position: absolute;
            top: 0;
            left: 0;
            content: "";
            box-sizing: border-box;
            width: 14px;
            height: 14px;
            background: #0151da;
            border-radius: 50%;
          }
          & > p {
            color: #454b5b;
          }
        }
        &:first-child {
          flex: 0 0 120px;
          & > .time {
            &::before {
              display: none;
            }
          }
        }
        // 类型1
        &.nothing {
          & > .time {
            color: #454b5b;
            &::before {
              border: 2px solid #9da7b3;
            }
          }
          & > .line {
            background: transparent;
          }
          & > .content {
            display: none;
          }
        }
      }
    }
  }

  & > .arrow {
    position: relative;
    margin: 35px 10px 0;
    width: 30px;
    height: 60px;
    cursor: pointer;
    &.left {
      // border: 1px solid red;
      &::before {
        position: absolute;
        top: 50%;
        right: calc(50% - 10px);
        transform: translateY(-50%);
        content: "";
        width: 20px;
        height: 20px;
        background: transparent;
        border-top: 20px solid transparent;
        border-bottom: 20px solid transparent;
        border-left: 20px solid transparent;
        border-right: 20px solid #647080;
      }
      &::after {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        content: "<";
        color: #fff;
      }
    }
    &.right {
      // border: 1px solid blue;
      &::before {
        position: absolute;
        top: 50%;
        left: calc(50% - 10px);
        transform: translateY(-50%);
        content: "";
        width: 20px;
        height: 20px;
        background: transparent;
        border-top: 20px solid transparent;
        border-bottom: 20px solid transparent;
        border-left: 20px solid #647080;
        border-right: 20px solid transparent;
      }
      &::after {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        content: ">";
        color: #fff;
      }
    }
  }
}
</style>
