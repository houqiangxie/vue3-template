<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2022-05-25 11:37:54
 * @LastEditors: houqiangxie
 * @LastEditTime: 2024-01-16 17:34:53
-->
<template>
    <component :is="render()"></component>
</template>

<script setup lang="tsx">
import { NForm,NRate, NButton ,NConfigProvider, NFormItem, NEllipsis, NGrid,NGridItem, NFormItemGi } from 'naive-ui'
const themeOverridesConfig = {
    "common": {
        "iconColorDisabled": "rgba(209, 209, 209, 0)"
    },
    "Input": {
        "borderDisabled": "none",
    }
}


// 备注：当同一个label需要渲染多个组件，key,component,required，options,bind，bindItem等属性需要数组形式 bindItem:{showSlot:true,slotName:'name'}会优先渲染动态插槽
interface ConfigItem {
    label?: string, //搜索标签
    key: string | Array<string>, //绑定model的key
    component?: string | Array<string>, //组件名称 'NInput'
    bind?: Record<string, any>|Array<Record<string, any>>,//bind到动态组件的属性，需要什么属性参考组件文档 
    // bind:{showSlot:true,slotName:'name',hidden:true,required:true,options:[{label:'1',value:'1'}],type:'textarea',renderComponent: ((item: any, formModel: any, curData: any) => any),"onUpdateValue": (e) => {  }}
    slot?: Record<string, any>|Array<Record<string, any>>,//动态组件slot插槽
    bindItem?: Record<string, any>|Array<Record<string, any>> //bind到formItem的属性（class等） 
}
//组件使用方法
// const configItem:ConfigItem = {
//     label: '文字',
//     key: 'key',
//     component: 'NInput',
//     bind:{showSlot:true,slotName:'name',hidden:true,required:true,options:[{label:'1',value:'1'}],type:'textarea',renderComponent: ((item: any, formModel: any, curData: any) => any)}
//     slot: {default:(item: any, formModel: any, curData: any)=>(<div>3333</div>)},//动态组件slot插槽  插槽内容可以为string,html tsx
//     bindItem: {class:'col-span-2'} //bind到formItem的属性（class等） 
// }
const { config = [], cols = 2, formModel = {}, basePath = '', disabledHideBorder = false } = defineProps<{
    config: Array<ConfigItem>
    cols?: Number, //grid布局列
    formModel: any, //双向bind值
    basePath?: string,//表单校验基础路径
    disabledHideBorder?: boolean //表单禁用隐藏border
}>()
const themeOverrides = computed(() => disabledHideBorder ? themeOverridesConfig : {})

const componentList: Record<string, any> = {
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
    'phone_prefix': /\d{3,4}/,//固话前缀
    'phone_suffix': /\d{7,8}/,//固话后缀
    'phone_number': /^((0\d{2,3}-\d{7,8})|(1[3456789]\d{9}))$/,//手机号和固话
}

// 列校验
const setRule = (item: any, index?: number|null): Record<string, any> => {
    const rule: Record<string, any> = {}
    const bind = item?.bind?.[(index) as number] || item.bind||{}
    rule.required =bind.required|| item.required
    rule.trigger = rule.required ? ['input', 'blur'] : []
     rule.message = bind.message || ((bind.label|| item.label) + ('不能为空'))
    if (bind.patternType || bind.pattern) {
        const currentValidateReg= bind.pattern||validateReg[bind.patternType||'default']
        rule.message = bind.message || ((bind.label|| item.label) + (currentValidateReg!=validateReg.default ? '格式不正确' : '不能为空'))
        rule.validator = (rule: any, value: string) => {
            const transformValue = value ? String(value) : value
            if (!currentValidateReg?.test(transformValue)) return new Error('')
            return true
        }
    }
    // extendRule  扩展当前校验校验属性
    // extendRules 扩展其他校验，多个校验
    // rules 直接替换校验
    if (bind.extendRule) return [Object.assign(rule, bind.extendRule)]
    else if (bind.extendRules) return [rule, ...bind.extendRules]
    return [rule]
}
const slots = useSlots()
// checkbox radio 组件
const GroupComponent = (prop: any, index, Name,nameString) => {
    const GroupName =componentList[nameString+'Group']
    return (
        <GroupName className='w-full' {...prop?.bind} >
            <NGrid cols={prop.cols||2} x-gap={1}>
                {prop.bind?.options.map((option, i) => (<NGridItem span={prop.col || 1} ><Name value={option.value} disabled={option.disabled}>{option.label}</Name></NGridItem>))}
            </NGrid>
        </GroupName>
    )
}

// 动态组件;
const DynamicComponent = (prop: any, index?: number,flag?:boolean) => {
    if (!prop.bind) prop.bind = {}
    const { bind, key, component,slot, ...rest } = prop
    
    // if(prop.bind.slotName) return slots[prop.bind.slotName]
    if (prop.bind?.renderComponent || prop.component && Array.isArray(prop.component)||prop.bind?.slotName) {
        return (
            <NFormItem
                class='col-span-1'
                label={prop.label}
                showFeedback={prop.component && Array.isArray(prop.component)?false:true}
                {...rest}
            > {
                    prop.bind?.renderComponent ? prop.bind.renderComponent(prop, formModel,formModel[prop.key]) :
                    prop.bind.slotName?slots[prop.bind.slotName]():
                        (
                        <NGrid cols={prop.cols||2} x-gap={1}>
                            {prop.component.map((component, i) => <NGridItem span={prop.bind?.col || 1}>{DynamicComponent({ bind: prop.bind[i], key: prop.key[i],label:prop.label, component, bindItem: prop.bindItem?.[i],slot:prop.slot?.[i] },i,true)}</NGridItem>)}
                        </NGrid>)
                }
            </NFormItem>)
    }
    let Name = ''
    const path = basePath + (typeof prop.key == 'string' ? prop.key : prop.key?.[0])
    Name = componentList[prop.component||'NInput']
    let currentComponent = <Name {...bind} v-model:value={formModel[prop.key]} >{slot}</Name>
    switch (prop.component) {
        case 'Checkbox':
        case 'Radio':
            currentComponent = GroupComponent(prop, index, Name,prop.component)
        // default: Name = componentList[prop.component]
        //     break;
    }
    return (
        <NFormItem
            class="col-span-1" label={prop.label}
            path={path}
            rule={setRule(prop,flag?index:null)}
            {...rest}
        >{currentComponent}
        </NFormItem>
    )
}

const render = () => {
    
    return (
        <div class={`w-full p-5 bg-white common-form ${disabledHideBorder?'hide-border':''}`}>
        <NConfigProvider theme-overrides={themeOverrides}>
                <div class={`form_box w-full grid grid-cols-${cols} gap-x-5`}>
                    {config.map((item, index) => { return DynamicComponent(item,index,false) })}
                    {slots.default?.()}
                </div>
        </NConfigProvider>
        </div>
    )
}


// 使用示例
{/* <n-form ref="formRef" :model="formModel"></n-form>
            <CommonForm :config="columns" v-model:formModel="formModel">
                <template #testSlot>
                    <div>
                        dsdsddweoje我能大水量
                    </div>
                </template>
                <div>ewoewjoiewi default</div>
            </CommonForm>
        </n-form>
        <n-button @click="submitForm">提交</n-button> */}
        
// const formModel = ref({data:[{},{}]})
// const formRef = ref()
// const submitForm = async () => {
//     try {
        
//         const e = await formRef.value.validate()
//         console.log('e: ', e);
//         console.log('e: ', formModel.value);
//     } catch (error) {
//         console.log('error: ', error);
        
//     }
// }
// const subColumns = (i:number) => {
//     return[
//         { label: "事件", key: 'sub1', bind: { required:true} },
//         { label: "dd", key: 'sub2', bind: {}, slot: { prefix() { return 'women ' } } },
//     ]
// }
// const columns = [
//     { label: "43", key: '333', bind: { required:true} },
//     { label: "43", key: '333333', bind: { required:false} },
//     { label: "44", key: '44', bind: { required:true} },
//     { label: "45", key: '45', bind: { required:true} },
//     { label: "ere", key: '444', bind: {}, slot: { prefix() { return 'women ' } } },
//     {
//         label: "women dous ", key: '33', bind:{
//             renderComponent() {
//                 // return <div onClick={() => console.log(22)}>我们都是</div>
//                 return formModel.value.data.map((item,i)=><CommonForm config={subColumns(i)} basePath={`data.${i}.`} v-model:formModel={formModel.value.data[i]} />)
//             }
//         }
//     },
//     { label: "事件", key: '333', bind:{ "onUpdateValue": (e) => { console.log(e, '组件事件驼峰命名') } }},
//     { label: "组件slot前置slot", key: '33', bind:{  }, slot: { prefix() { return 'women ' } } },
//     {label: "组件自定义命名slot渲染 ",key:'33',component:'NInput',bind:{slotName:'testSlot'}},
//     {label: "多个嵌套 ",key:['aa','bb'],component:['NInput','NInput'],bind:[{required:true}, { required: false }], bindItem: [{ showLabel:false }, { labelWidth:200 ,label:'22'}] ,class:'col-span-2',required:true},
// ]

</script>

<style lang="scss" scoped>
.common-form.hide-border {

    :deep(.n-form-item-blank) {
        .n-base-selection--disabled {
            .n-base-selection__border {
                border: none;
            }

            .n-base-loading.n-base-suffix {
                display: none !important;
            }

            .n-base-selection-input {
                // color:#999;
            }
        }

        .n-date-picker--disabled {
            .n-base-selection__border {
                border: none;
            }

            .n-input__suffix {
                display: none !important;
            }
        }

        .n-tag--disabled {
            border: none;

            .n-base-selection__border {
                border: none;
            }

            button {
                display: none !important;
            }
        }

        .n-input--disabled {
            .n-input__input-el {
                // color:#999 !important;
            }

            .n-input-word-count {
                display: none;
            }
        }


    }

    :deep(.user-select .label) {
        border: none !important;
    }

    // :deep(.n-upload-trigger + .n-upload-file-list){
    //     position: relative;
    //     top: -34px;
    // }
}

:deep(.n-input.n-input--disabled .n-input__input-el, .n-input.n-input--disabled .n-input__textarea-el) {
    cursor: default !important;
}

:deep(.n-input.n-input--disabled) {
    cursor: default !important;
}

:deep(.n-base-selection.n-base-selection--disabled) {
    cursor: default !important;
}

:deep(.n-base-selection.n-base-selection--disabled .n-base-selection-label) {
    cursor: default !important;
}

:deep(.n-input-number) {
    .n-input__suffix {
        display: none;
    }
}</style>

<style>
.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.grid-cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.grid-cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.grid-cols-5 {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
</style>

