<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2022-05-24 18:46:42
 * @LastEditors: houqiangxie
 * @LastEditTime: 2022-06-09 15:36:00
-->
<template>
    <div class="w-full p-5 search-box bg-white relative">
        <n-form :inline='true'  label-placement="left" :model="searchModel" ref="searchForm">
        <n-form-item :label="item.label||item.title" :size="item.size||'medium'"  :path="item.key" v-for="(item,index) in config" :key="index"  v-show="showAllSearchField||item.isSearch">
          <component class="w-40" :is="componentList[item.component||'NInput']" v-model:value="searchModel[item.key]"  :options="item.options" :type="item.type" v-bind="item.bind"></component>
        </n-form-item>
      </n-form>
      <div class="absolute top-5 right-5 flex items-center">
          <template v-if="showSearchButton">
            <n-button class="mr-2" type="info" @click="getList"><svg class="icon text-white text-xl mr-1" aria-hidden="true"><use xlink:href="#icon-search"></use></svg>查询</n-button>
            <n-button class="mr-2" type="info" ghost @click="resetForm"><svg class="icon text-[#2080f0] text-xs mr-1" aria-hidden="true"><use xlink:href="#icon-reset"></use></svg>重置</n-button>
          </template>
          <slot></slot>   
      </div>
    </div>
</template>

<script setup lang="ts">
const {config=[],showAllSearchField=false,searchModel={},showSearchButton=true} = defineProps<{
    config:Array<{label:string,title:string, key:string,required?:boolean,isSearch?:boolean,component?:string,options?:Array<any>,type?:string,bind?:any,size?:string}>
    showAllSearchField?:boolean,
    searchModel:any,
    showSearchButton?:boolean
}>()
const emit = defineEmits<{
    (e:'search',payload:any):void;
}>()

const componentList:any = ref({
    NInput:shallowRef(NInput),
    NSelect:shallowRef(NSelect),
    NDatePicker:shallowRef(NDatePicker),
})
const searchForm = ref()

const resetForm = ()=>{
    config.forEach(s=>{
        searchModel[s.key]=null
    })
    emit('search',searchModel)
}

const getList = ()=>{
    emit('search',searchModel)
}

watch(searchModel,()=>{
    if(!showSearchButton)emit('search',searchModel)
})

</script>

<style scoped>
 .search-box :deep(.n-form-item-feedback-wrapper){
     display:none !important;
 }
</style>