<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2023-04-02 15:06:01
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-04-11 17:17:18
-->
<template>
    <!-- <div class="">
        <WujieVue
      width="100%"
      height="100%"
      name="yjdw"
      :sync="true"
      :url="'/rsxt/#/?token=b7d4df6c-bbba-3498-98c3-289c5289f6b3'"
      :fetch="customFetch"
    ></WujieVue> -->
    <!-- <iframe src="https://172.17.30.184:8888/#/index/home/homeindex?token=b7d4df6c-bbba-3498-98c3-289c5289f6b3" class="w-200 h-100 border-0"></iframe> -->
    <micro-app name="dw" url="https://172.17.30.184:8888" iframe disable-patch-request disable-memory-router></micro-app>
    <!-- </div> -->
</template>

<script setup lang="ts">
import WujieVue from "wujie-vue3";
const customFetch = async(e) => {
  if (e.includes('assets')) {
    e='https://172.17.30.184:8888'+e.replace('')
  }
  const res = await fetch(e)
  return res
}
</script>