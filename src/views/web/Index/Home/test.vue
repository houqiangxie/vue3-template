<script setup lang="ts">
import moduleComponentsRoutes from '~moduleComponentsRoutes'
console.log('moduleComponentsRoutes: ', moduleComponentsRoutes);
const demoList = [
    {
        title: '1*X',
        list: [
            { key: 'demoComponent', title: '1x1', column: 1, row: 1 },
            { key: 'demoComponent', title: '1x2', column: 1, row: 2 },
            { key: 'demoComponent', title: '1x3', column: 1, row: 3 },
            { key: 'demoComponent', title: '1x4', column: 1, row: 4 },
        ],
    },
    {
        title: '2*X',
        list: [
            { key: 'demoComponent', title: '2x1', column: 2, row: 1 },
            { key: 'demoComponent', title: '2x2', column: 2, row: 2 },
            { key: 'demoComponent', title: '2x3', column: 2, row: 3 },
            { key: 'demoComponent', title: '2x4', column: 2, row: 4 },
        ],
    },
    {
        title: '3*X',
        list: [
            { key: 'demoComponent', title: '3x1', column: 3, row: 1 },
            { key: 'demoComponent', title: '3x2', column: 3, row: 2 },
            { key: 'demoComponent', title: '3x3', column: 3, row: 3 },
            { key: 'demoComponent', title: '3x4', column: 3, row: 4 },
        ],
    },
    {
        title: '4*X',
        list: [
            { key: 'demoComponent', title: '4x1', column: 4, row: 1 },
            { key: 'demoComponent', title: '4x2', column: 4, row: 2 },
            { key: 'demoComponent', title: '4x3', column: 4, row: 3 },
            { key: 'demoComponent', title: '4x4', column: 4, row: 4 },
        ],
    },
];


const data = ref([
    {
        id: 1111,
        key: 'demoComponent',
        title: '组件标题',
        column: 1,
        row: 1,
        x: 1,
        y: 1,
    },
    {
        id: 2222,
        key: 'demoComponentpy',
        title: '组件标题',
        column: 1,
        row: 1,
        x: 2,
        y: 3,
    },
]);
// watchEffect(() => {
//     console.log(data.value);
// });
watch(()=>data.value, () => {
    console.log(data.value);
});
const dropContentRef = ref<InstanceType<typeof DropContent>>();
</script>
<template>
    <div class="drag-container">
        <div class="drag-container__left">
            <LeftSidebar :list="demoList" group-name="drag-demo" />
        </div>
        <div class="drag-container__right">
            <div class="mb16" style="width: 100%; height: 100%">
                <DropContent v-model="data" ref="dropContentRef" group-name="drag-demo" :row="6" :column="6" :gap="6">
                    <template #preview-item="{ data }">
                        <div class="bg-[#f9f1c7] w-full h-full rounded flex justify-center items-center">{{ data.title }}</div>
                    </template>
                    <template #move-mask="{ isPutDown }">
                        <div :style="{
                width: '100%',
                height: '100%',
                border: '2px solid #2867f979',
                backgroundColor: isPutDown ? '#2867f91c' : '#ff000055',
                borderColor: isPutDown ? '#2c68f3' : '#ff000079',
                'border-radius': '6px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontWeight: '600',
            }">
                            {{ isPutDown ? '可以放置' : '不可放置' }}
                        </div>
                    </template>
                </DropContent>
            </div>
            <!-- <div class="mb16">
                <button @click="() => dropContentRef.addRow()">添加行</button>
                <button @click="() => dropContentRef.deleteRow()">删除行</button>
            </div> -->
            <h3 class="mb16">预览</h3>
            <div style="width: 100%; height: 100%">
                <PreviewLayout :data="data" :row="6" :column="6" :gap="6" :skipEmpty="false" />
            </div>
        </div>
    </div>
</template>
<style scoped lang="scss">
.drag-container {
    height: 100%;
    width: 100%;
    overflow: hidden;
    background-color: #fff;
    display: flex;
    flex-shrink: 0;

    &__left {
        width: 260px;
    }

    &__right {
        flex: 1;
        width: 0;
        background: #032bfb1a;
        border-radius: 6px;
        padding: 20px;
        height: 100%;
        overflow-y: auto;
    }
}
</style>
