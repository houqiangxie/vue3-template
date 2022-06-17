<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2022-06-09 10:28:29
 * @LastEditors: houqiangxie
 * @LastEditTime: 2022-06-09 10:42:45
-->
<template>
  <div class="pdf">
    <template v-for="item in pageNum" :key="item"  class="pdf-page">
      <canvas :id="`pdf-canvas-${item}`"></canvas>
    </template>
  </div>
</template>
<script setup lang="ts">
import PDF  from 'pdfjs-dist'
console.log('PDF: ', PDF);
PDF.GlobalWorkerOptions.workerSrc = 'node_modules/pdfjs-dist/web/pdf_viewer.js'
const props = defineProps({
    url: {
      type: String,
      default: ''
    }
  });

const state = reactive({
    url:'',
    pageNum: 0,
    pdfCtx: null
})
onMounted(() => {
    if (props.url) {
    state.url = props.url
    loadingTaskPdf (state.url)
    } 
})
const loadingTaskPdf = (url) => {
    const loadingTask = PDF.getDocument(url)
    loadingTask.promise.then(pdf => {
    state.pdfCtx = pdf
    state.pageNum = pdf.numPages
    nextTick(() => {
        renderPdf()
    })
    })
}
const renderPdf = (num = 1) => {
    state.pdfCtx.getPage(num).then(page => {
    // 获取元素
    const canvas = document.getElementById(`pdf-canvas-${num}`)
    const ctx = canvas.getContext('2d')
    // 设置缩放值
    const viewport = page.getViewport(1.4)
    canvas.height = viewport.height 
    canvas.width = viewport.width 
    page.render({
        canvasContext: ctx,
        viewport: viewport
    })
    //是否达到最大页数
    if (num < state.pageNum) {
        renderPdf(num + 1)
    } 
    })
}
</script>
<style scoped lang="scss">
.pdf canvas{
display: block;
margin: 0 auto
}
</style>





