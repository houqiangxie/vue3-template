import fs from 'fs'
import path from 'path'

const root = process.cwd()

function read(p) {
  return fs.readFileSync(path.join(root, p), 'utf8')
}

function write(p, c) {
  fs.writeFileSync(path.join(root, p), c, 'utf8')
  console.log('updated', p)
}

function normalizeWidth(w) {
  if (/^\d+$/.test(w)) return `${w}px`
  return w
}

/**
 * Replace a single Dialog element (opening through matching closing) with n-modal.
 */
function replaceDialogs(src) {
  let out = ''
  let i = 0
  while (i < src.length) {
    const start = src.indexOf('<Dialog', i)
    if (start === -1) {
      out += src.slice(i)
      break
    }
    out += src.slice(i, start)

    // find end of opening tag
    let j = start + 7
    let inQuote = null
    while (j < src.length) {
      const ch = src[j]
      if (inQuote) {
        if (ch === inQuote) inQuote = null
      } else if (ch === '"' || ch === "'") {
        inQuote = ch
      } else if (ch === '>') {
        break
      }
      j++
    }
    const openTag = src.slice(start, j + 1)
    const attrs = openTag.slice('<Dialog'.length, -1)

    // find matching close </Dialog>
    const closeIdx = src.indexOf('</Dialog>', j + 1)
    if (closeIdx === -1) {
      throw new Error('Unclosed Dialog near: ' + openTag.slice(0, 80))
    }
    const inner = src.slice(j + 1, closeIdx)

    const vm = attrs.match(/v-model="([^"]+)"/) || attrs.match(/v-model='([^']+)'/)
    if (!vm) throw new Error('Dialog missing v-model: ' + openTag)

    let titleAttr = ''
    const dynTitle = attrs.match(/:title="([^"]+)"/)
    const statTitle = attrs.match(/(?:^|\s)title="([^"]+)"/)
    if (dynTitle) titleAttr = `:title="${dynTitle[1]}"`
    else if (statTitle) titleAttr = `title="${statTitle[1]}"`

    let width = '40%'
    const w = attrs.match(/(?:^|\s)width="([^"]+)"/) || attrs.match(/:width="([^"]+)"/)
    if (w) width = normalizeWidth(w[1])

    const scroll = /:scroll="true"|\sscroll(?:=["']true["'])?/.test(attrs)
    const maxHMatch =
      attrs.match(/max-height="([^"]+)"/) || attrs.match(/:max-height="([^"]+)"/)
    const maxHeight = maxHMatch ? maxHMatch[1] : '400px'

    let body = inner
    // footer template stays as-is inside n-modal
    if (scroll) {
      // wrap non-footer content
      const footerMatch = body.match(/([\s\S]*?)(<template\s+#footer>[\s\S]*<\/template>\s*)$/)
      if (footerMatch) {
        body =
          `\n  <div :style="{ maxHeight: '${maxHeight}', overflow: 'auto' }">${footerMatch[1]}\n  </div>\n  ${footerMatch[2]}`
      } else {
        body = `\n  <div :style="{ maxHeight: '${maxHeight}', overflow: 'auto' }">${body}\n  </div>\n`
      }
    }

    out += `<n-modal
  v-model:show="${vm[1]}"
  preset="card"
  ${titleAttr}
  :style="{ width: '${width}' }"
  :bordered="false"
  display-directive="if"
  class="app-dialog"
>${body}</n-modal>`

    i = closeIdx + '</Dialog>'.length
  }

  out = out.replace(/import\s*\{\s*Dialog\s*\}\s*from\s*['"]@\/components\/Dialog['"]\s*\r?\n?/g, '')
  return out
}

function mapXButtonType(t) {
  if (!t || t === 'default' || t === 'info' || t === '') return null
  if (t === 'danger') return 'error'
  return t
}

function mapXButtonSize(s) {
  if (!s) return null
  if (s === 'mini') return 'tiny'
  if (s === 'default') return 'medium'
  return s
}

/**
 * Convert self-closing or simple XButton / XTextButton tags.
 * Handles multi-line tags ending with />
 */
function replaceXButtons(src) {
  const re = /<(XButton|XTextButton)\b([\s\S]*?)\/>/g
  return src.replace(re, (full, tag, attrs) => {
    const isText = tag === 'XTextButton'
    const get = (name, dyn = false) => {
      const prefix = dyn ? ':' : ''
      const m =
        attrs.match(new RegExp(`${prefix}${name}="([^"]*)"`)) ||
        attrs.match(new RegExp(`${prefix}${name}='([^']*)'`))
      return m ? m[1] : null
    }
    const getAny = (name) => {
      const dyn = get(name, true)
      if (dyn != null) return { dyn: true, val: dyn }
      const stat = get(name, false)
      if (stat != null) return { dyn: false, val: stat }
      return null
    }

    const title = get('title')
    const preIcon = get('preIcon')
    const postIcon = get('postIcon')
    const typeInfo = getAny('type')
    const sizeInfo = getAny('size')
    const classInfo = getAny('class')
    const styleInfo = getAny('style')
    const disabledInfo = getAny('disabled')
    const clickMatch = attrs.match(/@click="([^"]*)"/) || attrs.match(/@click='([^']*)'/)

    const parts = []
    if (isText) parts.push('text')

    if (typeInfo) {
      const mapped = typeInfo.dyn
        ? typeInfo.val
        : mapXButtonType(typeInfo.val)
      if (typeInfo.dyn) parts.push(`:type="${typeInfo.val}"`)
      else if (mapped) parts.push(`type="${mapped}"`)
    }

    if (sizeInfo) {
      if (sizeInfo.dyn) {
        // common pattern: headerButtonSize -> use naiveHeaderSize if present in same file later
        if (sizeInfo.val === 'headerButtonSize') parts.push(':size="naiveHeaderSize"')
        else parts.push(`:size="${sizeInfo.val}"`)
      } else {
        const mapped = mapXButtonSize(sizeInfo.val)
        if (mapped) parts.push(`size="${mapped}"`)
      }
    }

    if (classInfo) {
      parts.push(classInfo.dyn ? `:class="${classInfo.val}"` : `class="${classInfo.val}"`)
    }
    if (styleInfo) {
      parts.push(styleInfo.dyn ? `:style="${styleInfo.val}"` : `style="${styleInfo.val}"`)
    }
    if (disabledInfo) {
      parts.push(
        disabledInfo.dyn ? `:disabled="${disabledInfo.val}"` : `disabled="${disabledInfo.val}"`,
      )
    }
    if (clickMatch) parts.push(`@click="${clickMatch[1]}"`)

    let children = ''
    if (preIcon) children += `<Icon icon="${preIcon}" class="mr-1px" />`
    if (title) children += title
    if (postIcon) children += `<Icon icon="${postIcon}" class="mr-1px" />`

    // If icon-only and no title, still render icon
    if (!children && preIcon) children = `<Icon icon="${preIcon}" class="mr-1px" />`

    return `<n-button ${parts.join(' ')}>${children}</n-button>`
  })
}

function ensureIconImport(src) {
  if (!src.includes('<Icon ') && !src.includes('<Icon\n')) return src
  if (/from\s*['"]@\/components\/Icon['"]/.test(src)) return src
  // insert after script setup start
  if (/<script\b[^>]*>/.test(src)) {
    return src.replace(/(<script\b[^>]*>\r?\n)/, `$1import { Icon } from '@/components/Icon'\n`)
  }
  return src
}

function stripXButtonImport(src) {
  return src
    .replace(
      /import\s*\{\s*XButton\s*,\s*XTextButton\s*\}\s*from\s*['"]@\/components\/XButton['"]\s*\r?\n?/g,
      '',
    )
    .replace(
      /import\s*\{\s*XButton\s*\}\s*from\s*['"]@\/components\/XButton['"]\s*\r?\n?/g,
      '',
    )
    .replace(
      /import\s*\{\s*XTextButton\s*\}\s*from\s*['"]@\/components\/XButton['"]\s*\r?\n?/g,
      '',
    )
}

// -------- apply --------

// 1. ContentWrap
{
  const p = 'src/views/bpm/model/editor/index.vue'
  let s = read(p)
  s = s.replace(
    '<ContentWrap>',
    `<n-card class="mb-15px" size="small" :bordered="true" :content-style="{ padding: '10px' }">`,
  )
  s = s.replace('</ContentWrap>', '</n-card>')
  write(p, s)
}

const dialogFiles = [
  'src/components/bpmnProcessDesigner/package/designer/ProcessViewer.vue',
  'src/components/bpmnProcessDesigner/package/designer/ProcessDesigner.vue',
  'src/components/bpmnProcessDesigner/package/penal/time-event-config/TimeEventConfig.vue',
  'src/components/bpmnProcessDesigner/package/penal/task/task-components/HttpHeaderEditor.vue',
  'src/components/SimpleProcessDesigner/src/nodes/StartUserNode.vue',
  'src/components/SimpleProcessDesigner/src/nodes/UserTaskNode.vue',
  'src/components/SimpleProcessDesigner/src/nodes/EndEventNode.vue',
  'src/components/SimpleProcessDesigner/src/SimpleProcessDesigner.vue',
  'src/components/SimpleProcessDesigner/src/SimpleProcessModel.vue',
  'src/components/SimpleProcessDesigner/src/nodes-config/components/ConditionDialog.vue',
]

for (const p of dialogFiles) {
  let s = read(p)
  s = replaceDialogs(s)
  write(p, s)
}

const xButtonFiles = [
  'src/components/bpmnProcessDesigner/package/designer/ProcessDesigner.vue',
  'src/components/bpmnProcessDesigner/package/penal/signal-message/SignalAndMessage.vue',
  'src/components/bpmnProcessDesigner/package/penal/task/task-components/ReceiveTask.vue',
  'src/components/bpmnProcessDesigner/package/penal/task/task-components/UserTask.vue',
  'src/components/bpmnProcessDesigner/package/penal/task/task-components/CallActivity.vue',
  'src/components/bpmnProcessDesigner/package/penal/properties/ElementProperties.vue',
  'src/components/bpmnProcessDesigner/package/penal/listeners/ElementListeners.vue',
  'src/components/bpmnProcessDesigner/package/penal/listeners/UserTaskListeners.vue',
]

for (const p of xButtonFiles) {
  let s = read(p)
  s = replaceXButtons(s)
  s = stripXButtonImport(s)
  s = ensureIconImport(s)
  write(p, s)
}

console.log('done conversions')
