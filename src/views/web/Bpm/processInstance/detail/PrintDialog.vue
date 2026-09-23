<template>
  <n-modal
    v-model:show="visible"
    preset="card"
    title="打印预览"
    style="width: min(900px, 94vw)"
    :mask-closable="false"
  >
    <n-spin :show="loading">
      <div id="bpm-print-area" class="bpm-print">
        <div v-if="printData?.printTemplateEnable" v-html="templateHtml" />
        <div v-else-if="printData?.processInstance">
          <h2 class="bpm-print__title">{{ printData.processInstance.name }}</h2>
          <div class="bpm-print__meta-row bpm-print__meta-row--end">
            打印人员：{{ userName }}
          </div>
          <div class="bpm-print__meta-row">
            <span>流程编号：{{ printData.processInstance.id }}</span>
            <span>打印时间：{{ printTime }}</span>
          </div>
          <table class="bpm-print__table">
            <tbody>
              <tr>
                <td>发起人</td>
                <td>{{ printData.processInstance.startUser?.nickname || '-' }}</td>
                <td>发起时间</td>
                <td>{{ formatDate(printData.processInstance.startTime) }}</td>
              </tr>
              <tr>
                <td>所属部门</td>
                <td>{{ printData.processInstance.startUser?.deptName || '-' }}</td>
                <td>流程状态</td>
                <td>
                  {{ getDictLabel(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS, printData.processInstance.status) }}
                </td>
              </tr>
              <tr>
                <td colspan="4" class="bpm-print__section">表单内容</td>
              </tr>
              <tr v-for="item in formFields" :key="item.id">
                <td>{{ item.name }}</td>
                <td colspan="3">
                  <div v-html="item.html" />
                </td>
              </tr>
              <tr>
                <td colspan="4" class="bpm-print__section">流程节点</td>
              </tr>
              <tr v-for="item in printData.tasks || []" :key="item.id">
                <td>{{ item.name }}</td>
                <td colspan="3">
                  {{ item.description }}
                  <div v-if="item.signPicUrl" class="bpm-print__sign">
                    <img :src="item.signPicUrl" alt="签名">
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <n-empty v-else description="暂无打印数据" />
      </div>
    </n-spin>
    <template #footer>
      <n-space justify="end">
        <n-button @click="visible = false">取消</n-button>
        <n-button type="primary" :disabled="!printData" @click="handlePrint">打印</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { getInfo } from '@/api/system/auth'
import { getProcessInstancePrintData } from '@/api/bpm/processInstance'
import { formatDate } from '@/utils/formatTime'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'

defineOptions({ name: 'BpmPrintDialog' })

const visible = ref(false)
const loading = ref(false)
const printData = ref<any>(null)
const userName = ref('')
const printTime = ref('')
const formFields = ref<Array<{ id: string, name: string, html: any }>>([])
const printDataMap = ref<Record<string, any>>({})
const templateHtml = ref('')

async function resolveUserName() {
  try {
    const { data } = await getInfo()
    userName.value = data?.user?.nickName || data?.user?.userName || '当前用户'
  }
  catch {
    userName.value = '当前用户'
  }
}

function decodeFormFields(raw: any[]): any[] {
  if (!Array.isArray(raw))
    return []
  return raw.map((item) => {
    if (typeof item === 'string') {
      try {
        return JSON.parse(item)
      }
      catch {
        return null
      }
    }
    return item
  }).filter(Boolean)
}

function parseFormFields() {
  if (!printData.value?.processInstance)
    return
  const fields = decodeFormFields(
    printData.value.processInstance.processDefinition?.formFields
    || printData.value.formFields
    || [],
  )
  const variables = printData.value.processInstance.formVariables || {}
  const res: Array<{ id: string, name: string, html: any }> = []
  for (const item of fields) {
    const id = item.field || item.key
    const name = item.title || item.label || id
    const variable = variables[id]
    let html: any = variable ?? ''
    const type = item.type
    if (type === 'UploadImg' && variable) {
      html = `<img src="${variable}" style="max-width:600px;" />`
    }
    else if (['radio', 'checkbox', 'select'].includes(type)) {
      const options = item.options || []
      if (Array.isArray(variable)) {
        html = options.filter((o: any) => variable.includes(o.value)).map((o: any) => o.label).join(',')
      }
      else {
        html = options.find((o: any) => o.value === variable)?.label ?? variable ?? ''
      }
    }
    printDataMap.value[id] = html
    res.push({ id, name, html })
  }
  formFields.value = res
}

function initPrintDataMap() {
  const pi = printData.value?.processInstance
  if (!pi)
    return
  printDataMap.value = {
    startUser: pi.startUser?.nickname || '',
    startUserDept: pi.startUser?.deptName || '',
    processName: pi.name || '',
    processNum: pi.id || '',
    startTime: formatDate(pi.startTime),
    endTime: formatDate(pi.endTime),
    processStatus: getDictLabel(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS, pi.status),
    printUser: userName.value,
    printTime: printTime.value,
  }
}

function buildProcessRecordTable(): string {
  const table = document.createElement('table')
  table.setAttribute('border', '1')
  table.setAttribute('style', 'width:100%;border-collapse:collapse;')
  const headTr = document.createElement('tr')
  const headTd = document.createElement('td')
  headTd.setAttribute('colspan', '2')
  headTd.setAttribute('style', 'text-align:center;')
  headTd.innerHTML = '流程节点'
  headTr.appendChild(headTd)
  table.appendChild(headTr)
  for (const item of printData.value?.tasks || []) {
    const tr = document.createElement('tr')
    const td1 = document.createElement('td')
    td1.innerHTML = item.name || ''
    const td2 = document.createElement('td')
    td2.innerHTML = item.description || ''
    tr.appendChild(td1)
    tr.appendChild(td2)
    table.appendChild(tr)
  }
  return table.outerHTML
}

function getPrintTemplateHTML() {
  const raw = printData.value?.printTemplateHtml || printData.value?.printTemplateContent || ''
  if (!raw)
    return ''
  const parser = new DOMParser()
  const doc = parser.parseFromString(raw, 'text/html')
  doc.querySelectorAll('table').forEach((item) => {
    item.setAttribute('border', '1')
    item.setAttribute('style', `${item.getAttribute('style') || ''}border-collapse:collapse;`)
  })
  doc.querySelectorAll('[data-w-e-type="mention"]').forEach((item) => {
    try {
      const mentionId = JSON.parse(decodeURIComponent(item.getAttribute('data-info') || ''))?.id
      item.innerHTML = printDataMap.value[mentionId] ?? ''
    }
    catch {
      // ignore
    }
  })
  const recordHtml = buildProcessRecordTable()
  doc.querySelectorAll('[data-w-e-type="process-record"]').forEach((item) => {
    item.innerHTML = recordHtml
  })
  return doc.body.innerHTML
}

async function open(id: string) {
  loading.value = true
  visible.value = true
  printTime.value = formatDate(new Date(), 'YYYY-MM-DD HH:mm')
  await resolveUserName()
  try {
    printData.value = await getProcessInstancePrintData(id)
    initPrintDataMap()
    parseFormFields()
    templateHtml.value = printData.value?.printTemplateEnable ? getPrintTemplateHTML() : ''
  }
  finally {
    loading.value = false
  }
}

function handlePrint() {
  const area = document.getElementById('bpm-print-area')
  if (!area)
    return
  const win = window.open('', '_blank')
  if (!win)
    return
  win.document.write(`<!DOCTYPE html><html><head><title>打印</title>
<style>
@media print { @page { size: auto; } body, html, div { height: auto !important; } }
body { font-family: sans-serif; color: #111; padding: 16px; }
table { width: 100%; border-collapse: collapse; margin-top: 16px; }
td { border: 1px solid #333; padding: 6px 8px; vertical-align: top; }
h2 { text-align: center; }
</style></head><body>${area.innerHTML}</body></html>`)
  win.document.close()
  win.focus()
  win.print()
}

defineExpose({ open })
</script>

<style scoped>
.bpm-print {
  word-break: break-all;
  min-height: 120px;
}
.bpm-print__title {
  margin: 0 0 12px;
  text-align: center;
  font-size: 20px;
}
.bpm-print__meta-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
  margin-bottom: 6px;
}
.bpm-print__meta-row--end {
  justify-content: flex-end;
}
.bpm-print__table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
}
.bpm-print__table td {
  border: 1px solid var(--n-border-color);
  padding: 6px 8px;
  width: 25%;
  vertical-align: top;
}
.bpm-print__section {
  text-align: center;
  font-weight: 600;
}
.bpm-print__sign img {
  width: 90px;
  height: 40px;
  object-fit: contain;
}
</style>
