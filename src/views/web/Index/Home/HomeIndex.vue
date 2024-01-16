<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2022-05-24 10:57:49
 * @LastEditors: houqiangxie
 * @LastEditTime: 2024-01-16 17:35:44
-->
<template>
    <div>
        <n-form ref="formRef" :model="formModel">
            <CommonForm :config="columns" v-model:formModel="formModel">
                <template #testSlot>
                    <div>
                        dsdsddweoje我能大水量
                    </div>
                </template>
                <div>ewoewjoiewi default</div>
            </CommonForm>
        </n-form>
        <n-button @click="submitForm">提交</n-button>
    </div>
</template>

<script lang="tsx" setup>
const formModel = ref({data:[{},{}]})
const formRef = ref()
const submitForm = async () => {
    try {
        
        const e = await formRef.value.validate()
        console.log('e: ', e);
        console.log('e: ', formModel.value);
    } catch (error) {
        console.log('error: ', error);
        
    }
}
const subColumns = (i:number) => {
    return[
        { label: "事件", key: 'sub1', bind: { required:true} },
        { label: "dd", key: 'sub2', bind: {}, slot: { prefix() { return 'women ' } } },
    ]
}
const columns = [
    { label: "43", key: '333', bind: { required:true} },
    { label: "43", key: '333333', bind: { required:false} },
    { label: "44", key: '44', bind: { required:true} },
    { label: "45", key: '45', bind: { required:true} },
    { label: "ere", key: '444', bind: {}, slot: { prefix() { return 'women ' } } },
    {
        label: "women dous ", key: '33', bind:{
            renderComponent() {
                // return <div onClick={() => console.log(22)}>我们都是</div>
                return formModel.value.data.map((item,i)=><CommonForm config={subColumns(i)} basePath={`data.${i}.`} v-model:formModel={formModel.value.data[i]} />)
            }
        }
    },
    { label: "事件", key: '333', bind:{ "onUpdateValue": (e) => { console.log(e, '组件事件驼峰命名') } }},
    { label: "组件slot前置slot", key: '33', bind:{  }, slot: { prefix() { return 'women ' } } },
    {label: "组件自定义命名slot渲染 ",key:'33',component:'NInput',bind:{slotName:'testSlot'}},
    {label: "多个嵌套 ",key:['aa','bb'],component:['NInput','NInput'],bind:[{required:true}, { required: false }], bindItem: [{ showLabel:false }, { labelWidth:200 ,label:'22'}] ,class:'col-span-2',required:true},
]

</script>