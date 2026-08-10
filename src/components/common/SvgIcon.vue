<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2022-08-11 10:42:00
 * @LastEditors: liulang 364276421@qq.com
 * @LastEditTime: 2023-04-11 09:20:07
-->
<template>
  <svg class="svg-icon" aria-hidden="true" :style="iconStyle">
    <use :xlink:href="symbolId" />
  </svg>
</template>

<script setup lang="ts">
const {
  prefix = 'icon',
  name,
  color = 'currentColor',
  size = 16,
} = defineProps<{
  prefix?: string
  name: string
  color?: string
  size?: number | string
}>()

const symbolId = computed(() => `#${prefix}-${name}`)
const iconStyle = computed(() => {
  const s = typeof size === 'number' ? `${size}px` : size
  return {
    width: s,
    height: s,
    fill: color,
    verticalAlign: '-0.15em',
  }
})
</script>

<style scoped>
.svg-icon {
  display: inline-block;
  overflow: hidden;
}
</style>