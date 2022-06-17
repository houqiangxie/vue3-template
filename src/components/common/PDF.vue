<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2022-06-09 10:03:52
 * @LastEditors: houqiangxie
 * @LastEditTime: 2022-06-09 12:25:13
-->
<!-- BasePdfView.vue -->
 <template>
  <div id="pdf-view">
    <div id="pdf"></div>
  </div>
</template>
<script>
export default {
name: "PdfView",
};
</script>

<script setup >
import Pdfh5 from "pdfh5";
import "pdfh5/css/pdfh5.css";
console.log('Pdfh5: ', Pdfh5);
const prop=defineProps(['url'])
const state = reactive({
    pdfh5: null
});
onMounted(() => {
    state.pdfh5 = new Pdfh5("#pdf", {
    pdfurl: prop.url
    });
    // state.pdfh5.on("complete", function (status, msg, time) {
    // console.log("状态：" + status + "，信息：" + msg + "，耗时：" + time + "毫秒，总页数：" + this.totalNum);
    // });
});
</script>

<style lang="scss" scoped>
#pdf-view {
  height: 100%;
  width:100% !important;
  #pdf {
    height: 100%;
    
  }
  :deep(.pdfViewer) {
    padding: 0;
    .pageContainer{
        // max-width: 100% !important;
    }
  }
}
</style>
