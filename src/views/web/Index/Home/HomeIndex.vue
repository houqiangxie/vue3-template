<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2022-05-24 10:57:49
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-06-04 17:07:48
-->
<template>
    <div>
        <CommonForm :config="columns" v-model:formModel="formModel"></CommonForm>
    </div>
</template>

<script lang="ts" setup>
import { useStorage, useSubStorage } from "ux-storage";
const storage = useStorage()
useSubStorage('aa', (v) => console.log(v))
setTimeout(() => {
    storage.setStorageSync('aa',1000)
}, 5000);
const formModel = ref({})
const columns = [
    {title: "women dous ",key:'33'},
    {title: "dsfds 颠三倒四 ",key:'33'},
    {title: "dsfds 颠三倒四 ",key:'33',component:'NRate'},
]
</script>