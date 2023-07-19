<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2022-05-24 10:57:49
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-07-19 14:58:06
-->
<template>
    <div>
        <CommonForm :config="columns" v-model:formModel="formModel"></CommonForm>
    </div>
</template>

<script lang="tsx" setup>
const formModel = ref({})
const showModal = ref({visible:true})
const columns = [
    {
        title: "women dous ", key: '33', renderComponent() {
            return <div onClick={() => console.log(22)}>我们都是</div>
        }
    },
    { title: "dsfds 颠三倒四 ", key: '33', slot: { prefix(){ return 'women ' } }},
    {title: "dsfds 颠三倒四 ",key:'33',component:'NRate'},
]
</script>