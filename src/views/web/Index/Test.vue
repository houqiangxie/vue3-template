<template>
    <div :style="{ height: 400 }">
        <tmap-map mapKey="OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77" :center="center" :zoom="14">
            <tmap-multi-polygon :id="id" :styles="styles" :geometries="geometries"  v-if="actionMode==0"/>
            <tmap-polygon-editor ref="editor" :id="id" :styles="styles" v-model="geometries" :snappable="true" v-else
                :action-mode="actionMode" @select="onSelect" @error="onError" @draw_complete="drawComplete"
                @adjust_complete="adjustComplete" @split_complete="splitComplete" @union_complete="unionComplete"
                @delete_complete="deleteComplete" />
            <div class="ctrl top-2 left-2">
                <div>
                    <button class='mr-2' @click.stop="actionMode = 2">绘制</button>
                    <button class='mr-2' @click.stop="split">分割</button>
                    <button class='mr-2' @click.stop="union">合并</button>
                    <button class='mr-2' @click.stop="adjustPolygon">校准线段</button>
                    <button class='mr-2' @click.stop="del">删除</button>
                    <button class='mr-2' @click.stop="stop">结束绘制</button>
                    <button class='mr-2' @click.stop="onSubmit">提交</button>
                </div>
            </div>
            <div class="absolute top-0 right-0 z-9999 bg-white w-60 h-full p-5">
                <div class="flex mb-2" v-for="item in geometries">
                    <span class="flex-1 truncate">{{ item.id }}</span>
                    <!-- <n-input v-model:value="item.name"></n-input> -->
                    <n-button @click="onLocation(item)">定位</n-button>
                </div>
            </div>
        </tmap-map>
    </div>
</template>

<script lang="ts" setup>
import { db } from 'ux-web-storage'
import * as turf from '@turf/turf'
const editor = ref();
const geometries = ref([])
const id = 'grid'
// const geometries = ref([
//     {
//         id: 'polygonTen', // 多边形图形数据的标志信息
//         // styleId: 'polygon', // 样式id
//         paths: [
//             { lat: 40.041054, lng: 116.272303 },
//             { lat: 40.039419, lng: 116.272721 },
//             { lat: 40.039764, lng: 116.274824 },
//             { lat: 40.041374, lng: 116.274491 },
//         ], // 多边形的位置信息
//         properties: {
//             // 多边形的属性数据
//             title: '腾讯北京总部',
//         },
//     },
//     {
//         id: 'polygonSina', // 多边形图形数据的标志信息
//         // styleId: 'polygon', // 样式id
//         paths: [
//             { lat: 40.041649, lng: 116.275059 },
//             { lat: 40.040828, lng: 116.275237 },
//             { lat: 40.040934, lng: 116.276079 },
//             { lat: 40.041041, lng: 116.276229 },
//             { lat: 40.041095, lng: 116.276481 },
//             { lat: 40.041058, lng: 116.276787 },
//             { lat: 40.041144, lng: 116.277613 },
//             { lat: 40.041965, lng: 116.277404 },
//             { lat: 40.041879, lng: 116.276653 },
//             { lat: 40.041776, lng: 116.276293 },
//             { lat: 40.041752, lng: 116.276073 },
//             { lat: 40.041768, lng: 116.275864 },
//         ],
//         properties: {
//             // 多边形的属性数据
//             title: '其他建筑物',
//         },
//     },
// ]);
const center = ref({ lng: 114.064896, lat: 22.549489 })
let isSplit=false
const actionMode = ref(1);
const styles = {
    drawing: {
        // color: '#3777FF', // 面填充色
        showBorder: true, // 是否显示拔起面的边线
        // borderColor: '#00FFFF', // 边线颜色
        borderColor: '#ff0000', // 边线颜色
    },
    selected: {
        // color: 'transparent', // 面填充色
        showBorder: false, // 是否显示拔起面的边线
        // borderColor: '#00ff00', // 边线颜色
        borderColor: '#0000FF',
    },
    polyLine: {
        borderColor: '#00ff00',
        color: '#00ff00'
    }
}

const select = () => {
    if (editor.value?.select) {
        editor.value.select();
    }
}
const stop = () => {
    if (editor.value?.stop) {
        editor.value.stop();
    }
    editor.value.select([])
    if (isSplit) {
        
        actionMode.value = 0
        setTimeout(() => {
            actionMode.value = 1
        }, 0);
    }else actionMode.value=1
}
const split = () => {
    const arr = getSelectedList()
    if (!arr.length) return window.$message.info('请先选择分割图形!')
    else if (arr.length != 1) return window.$message.info('只能选择一个分割图形!')
    if (editor.value?.split) {
        editor.value.split();
        isSplit=true
    }
}
const union = () => {
    const arr = getSelectedList()
    if (!arr.length||arr.length<2) return window.$message.info('请先选择相邻图形合并!')
    if (editor.value?.union) {
        editor.value.union();
    }
}
const del = () => {
    if (editor.value?.delete) {
        editor.value.delete();
    }
}

const getSelectedList = () => editor.value.getSelectedList()

// 校准多边形
const adjustPolygon = () => {
    const arr = getSelectedList()
    if (!arr.length||arr.length!=2) return window.$message.info('请先选择相邻图形校准线段!')
    try {
        const obj1 = arr[0].paths.map(e => ([e.lng, e.lat]))
        const obj2 = arr[1].paths.map(e => ([e.lng, e.lat]))
        const poly1 = turf.polygon([[...obj1, obj1[0]]])
        const poly2 = turf.polygon([[...obj2, obj2[0]]])
        const intersection = turf.intersect(turf.featureCollection([poly1, poly2]));;
        // poly2 被截取的部分
        const clippedPoly2 = turf.difference(turf.featureCollection([poly2, intersection]));;
        const pos = clippedPoly2.geometry.coordinates[0]
        if (pos.length) {
            pos.pop()
            const paths = pos.map(ee => ({ lng: ee[0], lat: ee[1] }))
            const index = geometries.value.findIndex(e => e.id == arr[1].id)
            geometries.value.splice(index, 1, { ...arr[1], paths })
            editor.value.updateOverlay()
        }
        editor.value.stop()
    } catch (error) {
        console.log('error: ', error);

    }
}

const onSelect = (e: TMap.PolygonGeometry) => {
}
const onError = (e: Record<string, string>) => {
    console.log('e: ', e);
    isSplit = false

}
const drawComplete = (e: Record<string, string>) => {
    actionMode.value = 1

}
const adjustComplete = (e: Record<string, string>) => {

}
const splitComplete = (e: Record<string, string>) => {

    editor.value.stop()
    isSplit=false
}
const unionComplete = (e: Record<string, string>) => {

    editor.value.stop()
}
const deleteComplete = (e: Record<string, string>) => {

}



const onLocation = (item) => {
    actionMode.value = 1

    nextTick(() => editor.value.select([item.id]))
}

const onSubmit = () => {
    db.set('grid', JSON.parse(JSON.stringify(geometries.value)))
}


onMounted(async () => {
    geometries.value = await db.get('grid') || []
})

</script>

<style lang="scss" scoped>
.ctrl {
    position: absolute;
    z-index: 1001;
    display: flex;
    align-items: center;
}
</style>