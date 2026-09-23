<template>
  <div class="my-process-designer" :style="bpmnThemeStyle">
    <div class="my-process-designer__header" style="z-index: 999; display: table-row-group">
      <slot name="control-header"></slot>
      <template v-if="!$slots['control-header']">
        <n-button-group key="file-control">
          <XButton
            :size="headerButtonSize"
            preIcon="ep:folder-opened"
            title="打开文件"
            @click="refFile.click()"
          />
          <n-tooltip placement="bottom" trigger="hover">
            <template #trigger>
              <XButton :size="headerButtonSize" title="下载文件" preIcon="ep:download" />
            </template>
            <div class="bpmn-tooltip-actions">
              <XTextButton title="下载为XML文件" @click="downloadProcessAsXml()" />
              <br />
              <XTextButton title="下载为SVG文件" @click="downloadProcessAsSvg()" />
              <br />
              <XTextButton title="下载为BPMN文件" @click="downloadProcessAsBpmn()" />
            </div>
          </n-tooltip>
          <n-tooltip trigger="hover">
            <template #trigger>
              <XButton :size="headerButtonSize" preIcon="ep:view" title="浏览" />
            </template>
            <XTextButton title="预览XML" @click="previewProcessXML" />
            <br />
            <XTextButton title="预览JSON" @click="previewProcessJson" />
          </n-tooltip>
          <n-tooltip
            v-if="props.simulation"
            trigger="hover"
            :content="simulationStatus ? '退出模拟' : '开启模拟'"
          >
            <template #trigger>
              <XButton
                :size="headerButtonSize"
                preIcon="ep:cpu"
                title="模拟"
                @click="processSimulation"
              />
            </template>
          </n-tooltip>
        </n-button-group>
        <n-button-group key="align-control">
          <n-tooltip trigger="hover" content="向左对齐">
            <template #trigger>
              <XButton
                :size="headerButtonSize"
                preIcon="fa:align-left"
                class="align align-bottom"
                @click="elementsAlign('left')"
              />
            </template>
          </n-tooltip>
          <n-tooltip trigger="hover" content="向右对齐">
            <template #trigger>
              <XButton
                :size="headerButtonSize"
                preIcon="fa:align-left"
                class="align align-top"
                @click="elementsAlign('right')"
              />
            </template>
          </n-tooltip>
          <n-tooltip trigger="hover" content="向上对齐">
            <template #trigger>
              <XButton
                :size="headerButtonSize"
                preIcon="fa:align-left"
                class="align align-left"
                @click="elementsAlign('top')"
              />
            </template>
          </n-tooltip>
          <n-tooltip trigger="hover" content="向下对齐">
            <template #trigger>
              <XButton
                :size="headerButtonSize"
                preIcon="fa:align-left"
                class="align align-right"
                @click="elementsAlign('bottom')"
              />
            </template>
          </n-tooltip>
          <n-tooltip trigger="hover" content="水平居中">
            <template #trigger>
              <XButton
                :size="headerButtonSize"
                preIcon="fa:align-left"
                class="align align-center"
                @click="elementsAlign('center')"
              />
            </template>
          </n-tooltip>
          <n-tooltip trigger="hover" content="垂直居中">
            <template #trigger>
              <XButton
                :size="headerButtonSize"
                preIcon="fa:align-left"
                class="align align-middle"
                @click="elementsAlign('middle')"
              />
            </template>
          </n-tooltip>
        </n-button-group>
        <n-button-group key="scale-control">
          <n-tooltip trigger="hover" content="缩小视图">
            <template #trigger>
              <XButton
                :size="headerButtonSize"
                preIcon="ep:zoom-out"
                @click="processZoomOut()"
                :disabled="defaultZoom < 0.2"
              />
            </template>
          </n-tooltip>
          <n-button :size="naiveHeaderSize" disabled>
            {{ Math.floor(defaultZoom * 10 * 10) + '%' }}
          </n-button>
          <n-tooltip trigger="hover" content="放大视图">
            <template #trigger>
              <XButton
                :size="headerButtonSize"
                preIcon="ep:zoom-in"
                @click="processZoomIn()"
                :disabled="defaultZoom > 4"
              />
            </template>
          </n-tooltip>
          <n-tooltip trigger="hover" content="重置视图并居中">
            <template #trigger>
              <XButton
                :size="headerButtonSize"
                preIcon="ep:scale-to-original"
                @click="processReZoom()"
              />
            </template>
          </n-tooltip>
        </n-button-group>
        <n-button-group key="stack-control">
          <n-tooltip trigger="hover" content="撤销">
            <template #trigger>
              <XButton
                :size="headerButtonSize"
                preIcon="ep:refresh-left"
                @click="processUndo()"
                :disabled="!revocable"
              />
            </template>
          </n-tooltip>
          <n-tooltip trigger="hover" content="恢复">
            <template #trigger>
              <XButton
                :size="headerButtonSize"
                preIcon="ep:refresh-right"
                @click="processRedo()"
                :disabled="!recoverable"
              />
            </template>
          </n-tooltip>
          <n-tooltip trigger="hover" content="重新绘制">
            <template #trigger>
              <XButton :size="headerButtonSize" preIcon="ep:refresh" @click="processRestart()" />
            </template>
          </n-tooltip>
        </n-button-group>
      </template>
      <!-- 用于打开本地文件-->
      <input
        type="file"
        id="files"
        ref="refFile"
        style="display: none"
        accept=".xml, .bpmn"
        @change="importLocalFile"
      />
    </div>
    <div class="my-process-designer__container">
      <div
        class="my-process-designer__canvas"
        ref="bpmnCanvas"
        id="bpmnCanvas"
        style="width: 1680px; height: 800px"
      ></div>
      <!-- <div id="js-properties-panel" class="panel"></div> -->
      <!-- <div class="my-process-designer__canvas" ref="bpmn-canvas"></div> -->
    </div>
    <Dialog
      title="预览"
      v-model="previewModelVisible"
      width="80%"
      :scroll="true"
      max-height="600px"
    >
      <div>
        <pre><code v-dompurify-html="highlightedCode(previewResult)" class="hljs"></code></pre>
      </div>
    </Dialog>
  </div>
</template>

<script lang="ts" setup>
// import 'bpmn-js/dist/assets/diagram-js.css' // 左边工具栏以及编辑节点的样式
// import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css'
// import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css'
// import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'
// import 'bpmn-js-properties-panel/dist/assets/bpmn-js-properties-panel.css' // 右侧框样式
import { Dialog } from '@/components/Dialog'
import { XButton, XTextButton } from '@/components/XButton'
import { useMessage } from '@/hooks/web/useMessage'
import { useBpmnTheme } from '../theme/useBpmnTheme'
import BpmnModeler from 'bpmn-js/lib/Modeler'
import DefaultEmptyXML from './plugins/defaultEmpty'
// 翻译方法
import customTranslate from './plugins/translate/customTranslate'
import translationsCN from './plugins/translate/zh'
// 模拟流转流程
import tokenSimulation from 'bpmn-js-token-simulation'
// 标签解析构建器
// import bpmnPropertiesProvider from "bpmn-js-properties-panel/lib/provider/bpmn";
// import propertiesPanelModule from 'bpmn-js-properties-panel'
// import propertiesProviderModule from 'bpmn-js-properties-panel/lib/provider/camunda'
// 标签解析 Moddle
import camundaModdleDescriptor from './plugins/descriptor/camundaDescriptor.json'
import activitiModdleDescriptor from './plugins/descriptor/activitiDescriptor.json'
import flowableModdleDescriptor from './plugins/descriptor/flowableDescriptor.json'
// 标签解析 Extension
import camundaModdleExtension from './plugins/extension-moddle/camunda'
import activitiModdleExtension from './plugins/extension-moddle/activiti'
import flowableModdleExtension from './plugins/extension-moddle/flowable'
// 引入json转换与高亮
// import xml2js from 'xml-js'
// import xml2js from 'fast-xml-parser'
import { XmlNode, XmlNodeType, parseXmlString } from 'steady-xml'
import { hljs } from '@/utils/hljs'

const { bpmnThemeStyle } = useBpmnTheme()

defineOptions({ name: 'MyProcessDesigner' })

const message = useMessage()
const bpmnCanvas = ref()
const refFile = ref()
const emit = defineEmits([
  'destroy',
  'init-finished',
  'save',
  'commandStack-changed',
  'input',
  'change',
  'canvas-viewbox-changed',
  // eventName.name
  'element-click'
])

const props = defineProps({
  value: String, // xml 字符串
  // valueWatch: true, // xml 字符串的 watch 状态
  processId: String, // 流程 key 标识
  processName: String, // 流程 name 名字
  formId: Number, // 流程 form 表单编号
  translations: {
    // 自定义的翻译文件
    type: Object,
    default: () => {}
  },
  additionalModel: [Object, Array], // 自定义model
  moddleExtension: {
    // 自定义moddle
    type: Object,
    default: () => {}
  },
  onlyCustomizeAddi: {
    type: Boolean,
    default: false
  },
  onlyCustomizeModdle: {
    type: Boolean,
    default: false
  },
  simulation: {
    type: Boolean,
    default: true
  },
  keyboard: {
    type: Boolean,
    default: true
  },
  prefix: {
    type: String,
    default: 'camunda'
  },
  events: {
    type: Array,
    default: () => ['element.click']
  },
  headerButtonSize: {
    type: String,
    default: 'small',
    validator: (value: string) => ['default', 'medium', 'small', 'mini'].indexOf(value) !== -1
  },
  headerButtonType: {
    type: String,
    default: 'primary',
    validator: (value: string) =>
      ['default', 'primary', 'success', 'warning', 'danger', 'info'].indexOf(value) !== -1
  }
})

const naiveHeaderSize = computed(() => {
  const s = props.headerButtonSize
  if (s === 'mini')
    return 'tiny'
  if (s === 'default')
    return 'medium'
  return s as 'tiny' | 'small' | 'medium' | 'large'
})

/**
 * 代码高亮
 */
const highlightedCode = (code: string) => {
  // 高亮
  if (previewType.value === 'json') {
    code = JSON.stringify(code, null, 2)
  }
  const result = hljs.highlight(code, { language: previewType.value, ignoreIllegals: true })
  return result.value || '&nbsp;'
}

provide('configGlobal', props)
let bpmnModeler: any = null
const defaultZoom = ref(1)
const previewModelVisible = ref(false)
const simulationStatus = ref(false)
const previewResult = ref('')
const previewType = ref('xml')
const recoverable = ref(false)
const revocable = ref(false)
const additionalModules = computed(() => {
  console.log(props.additionalModel, 'additionalModel')
  const Modules: any[] = []
  // 仅保留用户自定义扩展模块
  if (props.onlyCustomizeAddi) {
    if (Object.prototype.toString.call(props.additionalModel) == '[object Array]') {
      return props.additionalModel || []
    }
    return [props.additionalModel]
  }

  // 插入用户自定义扩展模块
  if (Object.prototype.toString.call(props.additionalModel) == '[object Array]') {
    Modules.push(...(props.additionalModel as any[]))
  } else {
    props.additionalModel && Modules.push(props.additionalModel)
  }

  // 翻译模块
  const TranslateModule = {
    translate: ['value', customTranslate(props.translations || translationsCN)]
  }
  Modules.push(TranslateModule)

  // 模拟流转模块
  if (props.simulation) {
    Modules.push(tokenSimulation)
  }

  // 根据需要的流程类型设置扩展元素构建模块
  // if (this.prefix === "bpmn") {
  //   Modules.push(bpmnModdleExtension);
  // }
  console.log(props.prefix, 'props.prefix ')
  if (props.prefix === 'camunda') {
    Modules.push(camundaModdleExtension)
  }
  if (props.prefix === 'flowable') {
    Modules.push(flowableModdleExtension)
  }
  if (props.prefix === 'activiti') {
    Modules.push(activitiModdleExtension)
  }

  return Modules
})
const moddleExtensions = computed(() => {
  console.log(props.onlyCustomizeModdle, 'props.onlyCustomizeModdle')
  console.log(props.moddleExtension, 'props.moddleExtension')
  console.log(props.prefix, 'props.prefix')
  const Extensions: any = {}
  // 仅使用用户自定义模块
  if (props.onlyCustomizeModdle) {
    return props.moddleExtension || null
  }

  // 插入用户自定义模块
  if (props.moddleExtension) {
    for (let key in props.moddleExtension) {
      Extensions[key] = props.moddleExtension[key]
    }
  }

  // 根据需要的 "流程类型" 设置 对应的解析文件
  if (props.prefix === 'activiti') {
    Extensions.activiti = activitiModdleDescriptor
  }
  if (props.prefix === 'flowable') {
    Extensions.flowable = flowableModdleDescriptor
  }
  if (props.prefix === 'camunda') {
    Extensions.camunda = camundaModdleDescriptor
  }
  return Extensions
})
console.log(additionalModules, 'additionalModules()')
console.log(moddleExtensions, 'moddleExtensions()')
const initBpmnModeler = () => {
  if (bpmnModeler) return
  let data = document.getElementById('bpmnCanvas')
  console.log(data, 'data')
  console.log(props.keyboard, 'props.keyboard')
  console.log(additionalModules, 'additionalModules()')
  console.log(moddleExtensions, 'moddleExtensions()')

  bpmnModeler = new BpmnModeler({
    // container: this.$refs['bpmn-canvas'],
    // container: getCurrentInstance(),
    // container: needClass,
    // container: bpmnCanvas.value,
    container: data,
    // width: '100%',
    // 添加控制板
    // propertiesPanel: {
    // parent: '#js-properties-panel'
    // },
    keyboard: props.keyboard ? { bindTo: document } : null,
    // additionalModules: additionalModules.value,
    additionalModules: additionalModules.value,
    moddleExtensions: moddleExtensions.value

    // additionalModules: [
    // additionalModules.value
    // propertiesPanelModule,
    // propertiesProviderModule
    // propertiesProviderModule
    // ],
    // moddleExtensions: { camunda: moddleExtensions.value }
  })

  // bpmnModeler.createDiagram()

  // console.log(bpmnModeler, 'bpmnModeler111111')
  emit('init-finished', bpmnModeler)
  initModelListeners()
}

const initModelListeners = () => {
  const EventBus = bpmnModeler.get('eventBus')
  console.log(EventBus, 'EventBus')
  // 注册需要的监听事件, 将. 替换为 - , 避免解析异常
  props.events.forEach((event: any) => {
    EventBus.on(event, function (eventObj) {
      let eventName = event.replace(/\./g, '-')
      // eventName.name = eventName
      let element = eventObj ? eventObj.element : null
      console.log(eventName, 'eventName')
      console.log(element, 'element')
      emit('element-click', element, eventObj)
      // emit(eventName, element, eventObj)
    })
  })
  // 监听图形改变返回xml
  EventBus.on('commandStack.changed', async (event) => {
    try {
      recoverable.value = bpmnModeler.get('commandStack').canRedo()
      revocable.value = bpmnModeler.get('commandStack').canUndo()
      let { xml } = await bpmnModeler.saveXML({ format: true })
      emit('commandStack-changed', event)
      emit('input', xml)
      emit('change', xml)
      emit('save', xml)
    } catch (e: any) {
      console.error(`[Process Designer Warn]: ${e.message || e}`)
    }
  })
  // 监听视图缩放变化
  bpmnModeler.on('canvas.viewbox.changed', ({ viewbox }) => {
    emit('canvas-viewbox-changed', { viewbox })
    const { scale } = viewbox
    defaultZoom.value = Math.floor(scale * 100) / 100
  })
}
/* 创建新的流程图 */
const createNewDiagram = async (xml) => {
  console.log(xml, 'xml')
  // 将字符串转换成图显示出来
  let newId = props.processId || `Process_${new Date().getTime()}`
  let newName = props.processName || `业务流程_${new Date().getTime()}`
  let xmlString = xml || DefaultEmptyXML(newId, newName, props.prefix)
  try {
    // console.log(xmlString, 'xmlString')
    // console.log(this.bpmnModeler.importXML);
    let { warnings } = await bpmnModeler.importXML(xmlString)
    console.log(warnings, 'warnings')
    if (warnings && warnings.length) {
      warnings.forEach((warn) => console.warn(warn))
    }
  } catch (e: any) {
    console.error(`[Process Designer Warn]: ${e.message || e}`)
  }
}

// 下载流程图到本地
const downloadProcess = async (type) => {
  try {
    // 按需要类型创建文件并下载
    if (type === 'xml' || type === 'bpmn') {
      const { err, xml } = await bpmnModeler.saveXML()
      // 读取异常时抛出异常
      if (err) {
        console.error(`[Process Designer Warn ]: ${err.message || err}`)
      }
      let { href, filename } = setEncoded(type.toUpperCase(), xml)
      downloadFunc(href, filename)
    } else {
      const { err, svg } = await bpmnModeler.saveSVG()
      // 读取异常时抛出异常
      if (err) {
        return console.error(err)
      }
      let { href, filename } = setEncoded('SVG', svg)
      downloadFunc(href, filename)
    }
  } catch (e: any) {
    console.error(`[Process Designer Warn ]: ${e.message || e}`)
  }
  // 文件下载方法
  function downloadFunc(href, filename) {
    if (href && filename) {
      let a = document.createElement('a')
      a.download = filename //指定下载的文件名
      a.href = href //  URL对象
      a.click() // 模拟点击
      URL.revokeObjectURL(a.href) // 释放URL 对象
    }
  }
}

// 根据所需类型进行转码并返回下载地址
const setEncoded = (type, data) => {
  const filename = 'diagram'
  const encodedData = encodeURIComponent(data)
  return {
    filename: `${filename}.${type}`,
    href: `data:application/${
      type === 'svg' ? 'text/xml' : 'bpmn20-xml'
    };charset=UTF-8,${encodedData}`,
    data: data
  }
}

// 加载本地文件
const importLocalFile = () => {
  const file = refFile.value.files[0]
  const reader = new FileReader()
  reader.readAsText(file)
  reader.onload = function () {
    let xmlStr = this.result
    createNewDiagram(xmlStr)
    emit('save', xmlStr)
  }
}
/* ------------------------------------------------ refs methods ------------------------------------------------------ */
const downloadProcessAsXml = () => {
  downloadProcess('xml')
}
const downloadProcessAsBpmn = () => {
  downloadProcess('bpmn')
}
const downloadProcessAsSvg = () => {
  downloadProcess('svg')
}
const processSimulation = () => {
  simulationStatus.value = !simulationStatus.value
  console.log(bpmnModeler.get('toggleMode', 'strict'), "bpmnModeler.get('toggleMode')")
  props.simulation && bpmnModeler.get('toggleMode', 'strict').toggleMode()
}
const processRedo = () => {
  bpmnModeler.get('commandStack').redo()
}
const processUndo = () => {
  bpmnModeler.get('commandStack').undo()
}
const processZoomIn = (zoomStep = 0.1) => {
  let newZoom = Math.floor(defaultZoom.value * 100 + zoomStep * 100) / 100
  if (newZoom > 4) {
    throw new Error('[Process Designer Warn ]: The zoom ratio cannot be greater than 4')
  }
  defaultZoom.value = newZoom
  bpmnModeler.get('canvas').zoom(defaultZoom.value)
}
const processZoomOut = (zoomStep = 0.1) => {
  let newZoom = Math.floor(defaultZoom.value * 100 - zoomStep * 100) / 100
  if (newZoom < 0.2) {
    throw new Error('[Process Designer Warn ]: The zoom ratio cannot be less than 0.2')
  }
  defaultZoom.value = newZoom
  bpmnModeler.get('canvas').zoom(defaultZoom.value)
}
const processReZoom = () => {
  defaultZoom.value = 1
  bpmnModeler.get('canvas').zoom('fit-viewport', 'auto')
}
const processRestart = () => {
  recoverable.value = false
  revocable.value = false
  createNewDiagram(null)
}
const elementsAlign = (align) => {
  const Align = bpmnModeler.get('alignElements')
  const Selection = bpmnModeler.get('selection')
  const SelectedElements = Selection.get()
  if (!SelectedElements || SelectedElements.length <= 1) {
    message.warning('请按住 Shift 键选择多个元素对齐')
    return
  }
  message.confirm('自动对齐可能造成图形变形，是否继续？', '警告').then(() => {
    Align.trigger(SelectedElements, align)
  })
}
/*-----------------------------    方法结束     ---------------------------------*/
const previewProcessXML = () => {
  console.log(bpmnModeler.saveXML, 'bpmnModeler')
  bpmnModeler.saveXML({ format: true }).then(({ xml }) => {
    // console.log(xml, 'xml111111')
    previewResult.value = xml
    previewType.value = 'xml'
    previewModelVisible.value = true
  })
}
const previewProcessJson = () => {
  bpmnModeler.saveXML({ format: true }).then(({ xml }) => {
    const rootNodes = new XmlNode(XmlNodeType.Root, parseXmlString(xml))
    previewResult.value = rootNodes.parent?.toJSON() as unknown as string
    previewType.value = 'json'
    previewModelVisible.value = true
  })
}

/** 导出当前画布 XML（供父组件保存/发布前同步） */
const getXML = async (): Promise<string | null> => {
  if (!bpmnModeler) return null
  try {
    const { err, xml } = await bpmnModeler.saveXML({ format: true })
    if (err) {
      console.error(`[Process Designer Warn ]: ${err.message || err}`)
      return null
    }
    return xml || null
  } catch (e: any) {
    console.error(`[Process Designer Warn ]: ${e.message || e}`)
    return null
  }
}

defineExpose({ getXML })

/* ------------------------------------------------ 芋道源码 methods ------------------------------------------------------ */
onMounted(() => {
  initBpmnModeler()
  createNewDiagram(props.value)
})
onBeforeUnmount(() => {
  if (bpmnModeler) bpmnModeler.destroy()
  emit('destroy', bpmnModeler)
  bpmnModeler = null
})
</script>
