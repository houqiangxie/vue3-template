<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2022-05-24 10:57:49
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-06-20 10:22:35
-->
<template>
    <div>
        <CommonForm :config="columns" v-model:formModel="formModel"></CommonForm>
    </div>
</template>

<script lang="tsx" setup>
const formModel = ref({})
const columns = [
    {title: "women dous ",key:'33', renderComponent (){return <div>我们都是</div>}},
    {title: "dsfds 颠三倒四 ",key:'33'},
    {title: "dsfds 颠三倒四 ",key:'33',component:'NRate'},
]
</script>