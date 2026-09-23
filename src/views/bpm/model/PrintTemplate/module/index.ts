import withProcessRecord from './plugin'
import renderElemConf from './render-elem'
import elemToHtmlConf from './elem-to-html'
import parseHtmlConf from './parse-elem-html'
import processRecordMenu from './menu/ProcessRecordMenu'

const module = {
  editorPlugin: withProcessRecord,
  renderElems: [renderElemConf],
  elemsToHtml: [elemToHtmlConf],
  parseElemsHtml: [parseHtmlConf],
  menus: [processRecordMenu],
}

export default module
