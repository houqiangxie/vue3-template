import type { IDomEditor, SlateDescendant, SlateElement } from '@wangeditor/editor'

function parseHtml(
  _domElem: Element,
  _children: SlateDescendant[],
  _editor: IDomEditor,
): SlateElement {
  return {
    type: 'process-record',
    children: [{ text: '' }],
  } as SlateElement
}

const parseHtmlConf = {
  selector: 'span[data-w-e-type="process-record"]',
  parseElemHtml: parseHtml,
}

export default parseHtmlConf
