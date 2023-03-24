<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2022-05-25 11:37:54
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-03-24 17:07:08
-->
<template>
    <div class="w-full p-5 bg-white common-form" :class="{'hide-border':disabledHideBorder}">
        <n-config-provider :theme-overrides="themeOverrides">
            <!-- <n-form :inline='true'  label-placement="left" :model="formModel" ref="customForm"> -->
        <div :class="`form_box w-full grid grid-cols-${cols} gap-x-5`">
                <n-form-item class="col-span-1" :label="item.title" :path="basePath + (typeof item.key == 'string' ? item.key: item.key?.[0])" v-for="(item,index) in config" :key="index" :rule="setRule(item)" :show-feedback="typeof item.key=='string'||!item.bind?.notValidate" v-bind="item.bindItem"  v-show="!item.hidden">
                  <template #label>
                      <n-ellipsis class="w-full pr-2 " :class="{'text-[#757575]':disabledHideBorder&&item.bind&&item.bind.disabled}">{{item.title}}</n-ellipsis>
                  </template>
                  <slot v-if="item.bind?.slotName" :name="item.bind.slotName" :row="item"></slot>
                  <template v-else-if="typeof item.key=='string'">
                      <component class="w-full" :is="item.renderComponent? RenderTsx(item.renderComponent(item, formModel, formModel[item.key])): componentList[item.component||'NInput']" :type="item.type||'input'" v-model:value="formModel[item.component == 'NDatePicker'?(item.key+'value'):item.key]" v-model:formatted-value="formModel[item.key]" :clearable="true" :options="item.options" v-bind="item.bind" v-on="{ ...item.on }">
                        <template v-if="item.component == 'NCheckboxGroup'||item.component == 'NRadioGroup'">
                            <n-space>
                                <component :is="componentList[item.bind?.slotComponent]" :value="op.value" v-for="(op,oi) in item.options" :key="oi">{{op.label}}</component>
                            </n-space>
                        </template>
                      </component>
                  </template>
                  <template v-else>
                    <n-grid x-gap="12" :cols="item.key&&item.key.length">
                        <template v-for="(it,i) in item.key" :key="i">
                            <n-form-item-gi   :path="it" :rule="setRule(item,i)" v-if="!(item?.bind?.[i].hidden)">
                                <component class="w-full" :is="componentList[item.component&&item.component[i]||'NInput']" :type="item.type&&item.type[i]||'input'" v-model:value="formModel[item.component == 'NDatePicker' ? (it + 'value') : it]" v-model:formatted-value="formModel[it]" :clearable="true" :options="item.options&&item.options[i]" v-bind="item?.bind?.[i]||{}" v-on="{ ...(item?.on?.[i]??{}) }"></component>
                            </n-form-item-gi>
                        </template>
                    </n-grid>
                  </template>
                </n-form-item>
                <slot></slot>
            </div>
        </n-config-provider>
    </div>
</template>

<script setup lang="tsx">
import RenderComponent from './Render'
const RenderTsx = (data: any) => {
    return h(RenderComponent,{render:data})
}
const themeOverridesConfig ={
  "common": {
    "iconColorDisabled": "rgba(209, 209, 209, 0)"
  },
  "Input": {
    "borderDisabled": "none",
  }
}

// 备注：当同一个label需要渲染多个组件，key,component,required，options,bind，bindItem等属性需要数组形式 bindItem:{showSlot:true,slotName:'name'}会优先渲染动态插槽
interface ConfigItem{
    title?: string,//显示标签
    key: string | Array<string>, //绑定model的key
    required?: boolean|any, //必填属性
    hidden?: boolean, //是否渲染该字段
    component?: string, //组件名称 'NInput'
    options?: Array<any> | any, //select,tree等下拉list
    type?: string, //日期组件或textarea等组件type
    on?:Record<string,any>,//bind到动态组件的事件，需要什么属性参考组件文档
    bind?:Record<string,any>,//bind到动态组件的属性，需要什么属性参考组件文档
    bindItem?:Record<string,any> //bind到formItem的属性（class等） 
    renderComponent?: ((item:any, formData:any, curData:any) => any)
}
const {config=[],cols=2,formModel={},basePath='',disabledHideBorder=false} = defineProps<{
    config:Array<ConfigItem>
    cols?:Number, //grid布局列
    formModel:any, //双向bind值
    basePath?: string,//表单校验基础路径
    disabledHideBorder?:boolean //表单禁用隐藏border
}>()
const themeOverrides = computed(() => disabledHideBorder ? themeOverridesConfig : {})

const componentList:Record<string,any> = {
    NInput,
    NSelect,
    NDatePicker,
    NUpload,
    NInputNumber,
    NDynamicInput,
    NSwitch,
    NCheckboxGroup,
    NRadioGroup,
    NRadio,
    NRadioButton,
    NCheckbox,
    NTransfer,
    NCascader,
    NTreeSelect,
    NSlider,
    NColorPicker,
    NRate,
    // Editor: defineAsyncComponent(() => import('@/components/common/Editor.vue')),
    // UploadFile: defineAsyncComponent(() => import('@/components/common/UploadFile.vue')),
    // UserSelect: defineAsyncComponent(() => import('@/components/common/UserSelect.vue')),
    // CommonDatePicker: defineAsyncComponent(() => import('@/components/common/CommonDatePicker.vue')),
    // ESign: defineAsyncComponent(() => import('@/components/common/ESign.vue')),
}

// 默认校验正则
const validateReg: Record<string, RegExp> = {
    'default': /^.+$/,//非空正则
    'phone': /^[1][3,4,5,6,7,8,9][0-9]{9}$/, //手机号
    'phone_prefix':/\d{3,4}/,//固话前缀
    'phone_suffix':/\d{7,8}/,//固话后缀
    'phone_number': /^((0\d{2,3}-\d{7,8})|(1[3456789]\d{9}))$/,//手机号和固话
}

// 列校验
const setRule = (item:any,index?:number):Record<string,any> => {
    const rule: Record<string, any> = {}

    let value: any = formModel[item.key];
    if (index) value = formModel[item.key[index]];
    const bind = item?.bind?.[(index) as number] || item.bind||{}

    let fileType: string = 'string'
    switch (item.component) {
        case 'NCheckboxGroup':
        case 'NTransfer': fileType = 'array'; break;
        case 'Editor': fileType = 'string'; break;
        case 'NDatePicker': fileType = 'string'; break;
        case 'UploadFile': fileType = 'array'; break;
        case 'NRate': fileType = 'number'; break;
        default: fileType = typeof value == 'undefined' ? 'number' : typeof value; break;
    }
    if (item.bind?.multiple) fileType = 'array'
    rule.type = bind?.fileType??fileType

    rule.required = (index || index == 0) ?item.required?.[index] : item.required?.[0] ?? item.required 
    rule.message = bind.message || ((bind.title || item.title ) + '不能为空')
    rule.trigger=rule.required?['input','blur']:[]
    if (bind.patternType || bind.pattern) {
        rule.message =bind.message||((bind.title||item.title)+'格式不正确')
        rule.validator = (rule:any,value:string) => {
            if (!(validateReg[bind.patternType]?.test(value) || bind.pattern?.test(value))) return new Error('')
            return true
        }
    }
    if ((typeof item.key == 'object' && !(index || index == 0))||bind.notValidate) rule.validator = () => true
    return rule
}

</script>

<style lang="scss" scoped>
.common-form.hide-border{
    
    :deep(.n-form-item-blank){
        .n-base-selection--disabled{
             .n-base-selection__border{
                border:none;
            }
            .n-base-loading.n-base-suffix{
                display:none !important;
            }
            .n-base-selection-input{
                // color:#999;
            }
        }
        .n-date-picker--disabled{
             .n-base-selection__border{
                border:none;
            }
            .n-input__suffix{
                display:none !important;
            }
        }
        .n-tag--disabled{
            border:none;
             .n-base-selection__border{
                border:none;
            }
            button{
                display:none !important;
            }
        }
        .n-input--disabled{
             .n-input__input-el{
                // color:#999 !important;
            }
            .n-input-word-count{
                display: none;
            }
        }
        
        
    }
    :deep(.user-select .label){border:none !important;}
    // :deep(.n-upload-trigger + .n-upload-file-list){
    //     position: relative;
    //     top: -34px;
    // }
}
:deep(.n-input.n-input--disabled .n-input__input-el, .n-input.n-input--disabled .n-input__textarea-el){
    cursor: default !important;
}
:deep(.n-input.n-input--disabled){
    cursor: default !important;
}
:deep(.n-base-selection.n-base-selection--disabled){
    cursor: default !important;
}
:deep(.n-base-selection.n-base-selection--disabled .n-base-selection-label){
    cursor: default !important;
}
:deep(.n-input-number) {
    .n-input__suffix {
        display: none;
    }
}
</style>