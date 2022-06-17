<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2022-05-25 11:37:54
 * @LastEditors: houqiangxie
 * @LastEditTime: 2022-06-09 14:57:27
-->
<template>
    <div class="w-full p-5 bg-white common-form">
        <!-- <n-form :inline='true'  label-placement="left" :model="formModel" ref="customForm"> -->
        <div :class="`form_box w-full grid grid-cols-${cols} gap-x-5`">
            <n-form-item class="col-span-1" :size="item.size||'medium'" :label="item.label||item.title" :path="item.key" v-for="(item,index) in config" :key="index" :rule="{ required: item.required, message: (item.label||item.title)+'不能为空'
            ,type:setRule(item), trigger: ['change', 'blur'],...(item.validateRule||{})}"  v-show="!item.hidden">
              <template #label>
                  <n-ellipsis class="w-full pr-2">{{item.label||item.title}}</n-ellipsis>
              </template>
              <component class="w-full" :is="componentList[item.component||'NInput']" :type="item.type||'input'" v-model:value="formModel[item.key]"  :options="item.options" v-bind="item.bind" v-on="unitAppendOn(item)">
                <template v-if="item.component == 'NUpload'">
                    <template v-if="formModel[item.key]">
                        <img v-if="showFile(formModel[item.key])"  :src="formModel[item.key]" class="avatar" />
                    </template>
                    <n-button v-else> <svg class="icon" aria-hidden="true">
                        <use xlink:href="#icon-add"></use>
                    </svg></n-button>
                </template>
                <template v-if="item.component == 'NCheckboxGroup'||item.component == 'NRadioGroup'">
                    <n-space>
                        <component :is="componentList[item.bind.slotComponent]" :value="op.value" v-for="(op,oi) in item.options" :key="oi">{{op.label}}</component>
                    </n-space>
                </template>
              </component>
            </n-form-item>
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
const {config=[],cols=2,formModel={}} = defineProps<{
    config:Array<{label?:string,title?:string, key:string,component?:string,options?:Array<any>,bind?:any,required?:boolean,validateRule?:any,type?:string,hidden:boolean,isForm?:boolean,size?:'string'}>
    showAllFormField?:boolean,
    cols?:Number,
    formModel:any,
}>()
const emit = defineEmits<{
    (e:'search',payload:any):void;
}>()

const componentList:any = ref({
    NInput:shallowRef(NInput),
    NSelect:shallowRef(NSelect),
    NDatePicker:shallowRef(NDatePicker),
    NUpload:shallowRef(NUpload),
    NInputNumber:shallowRef(NInputNumber),
    NDynamicInput:shallowRef(NDynamicInput),
    NSwitch:shallowRef(NSwitch),
    NCheckboxGroup:shallowRef(NCheckboxGroup),
    NRadioGroup:shallowRef(NRadioGroup),
    NRadio:shallowRef(NRadio),
    NRadioButton:shallowRef(NRadioButton),
    NCheckbox:shallowRef(NCheckbox),
    NTransfer:shallowRef(NTransfer),
    NCascader:shallowRef(NCascader),
    NTreeSelect:shallowRef(NTreeSelect),
    NSlider:shallowRef(NSlider),
    NColorPicker:shallowRef(NColorPicker),
})

const resetForm = ()=>{
    config.forEach(s=>{
        formModel[s.key]=''
    })
}

const getList = ()=>{
    emit('search',formModel.value)
}

const setRule = (item:any)=>{
    const value :any= formModel[item.key];
    const multipleArr = ['NCheckboxGroup','NRadioGroup']
    let fileType:string = 'string'
    switch(item.component){
        case 'NCheckboxGroup':
        case 'NTransfer':fileType='array';break;
        default:fileType=typeof value=='undefined'?'string':typeof value;break;
    }
    if(item.bind?.multiple) fileType='array'
    return fileType
}

const showFile = (url:string)=>{
    const reg:any = /(png|jpg|jpeg|gif)$/
    return url.match(reg)
}

function unitAppendOn(item: any) {
  let loadOn = item.on ?? item.vSlot?.on ?? {};
  const params: any = {}; // 防止污染
  for (let key in loadOn) {
    params[key] = (e:any) => loadOn[key](e,item, formModel);
  }
  return params;
}

// defineExpose({customForm})
</script>

<style lang="scss" scoped>
.common-form{
    :deep(.n-input-number ){
        .n-input__suffix{
            display:none;
        }
    }
    :deep(.n-upload-trigger + .n-upload-file-list){
        position: relative;
        top: -34px;
    }
}
</style>