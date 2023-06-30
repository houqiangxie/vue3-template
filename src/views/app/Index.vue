<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2022-05-23 10:20:59
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-06-30 09:31:18
-->
<template>
  <div class="flex h-full pt-[60px]">
    <router-view class="h-full overflow-auto flex-1 bg-[#f4f4f4]"></router-view>
  </div>
</template>

<route>
  {
    "title": "eeee",
    "redirect":{"name":"Index-Home"}
  }
</route>

<script setup lang="ts">
import { MenuOption,MenuInst  } from 'naive-ui'
const router = useRouter()
const menuInstRef = ref<MenuInst >()
const selectKey = ref()
const route = useRoute();

</script>
 