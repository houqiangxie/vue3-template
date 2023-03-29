<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2022-05-24 10:57:49
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-03-24 17:07:45
-->
<template>
    <div>
        <CommonForm :config="columns" v-model:formModel="formModel"></CommonForm>
    </div>
</template>

<script lang="ts" setup>
const formModel = ref({})
const columns = [
    {title: "women dous ",key:'33'},
    {title: "dsfds 颠三倒四 ",key:'33'},
    {title: "dsfds 颠三倒四 ",key:'33',component:'NRate'},
]
</script>