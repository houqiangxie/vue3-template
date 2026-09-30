/**
 * 轻量 HTML 消毒：去掉脚本/内嵌框架及常见 XSS 向量，供 v-html 场景使用。
 * 不依赖 DOMPurify，适合模板内打印预览等可信度一般的 HTML。
 */
const DANGEROUS_TAGS = /^(script|iframe|object|embed|link|meta|base|form)$/i

export function sanitizeHtml(html: string): string {
  if (!html)
    return ''

  if (typeof DOMParser === 'undefined')
    return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')

  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('*').forEach((el) => {
    if (DANGEROUS_TAGS.test(el.tagName)) {
      el.remove()
      return
    }
    ;[...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase()
      const value = attr.value.trim()
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name)
        return
      }
      if ((name === 'href' || name === 'src' || name === 'xlink:href') && /^javascript:/i.test(value))
        el.removeAttribute(attr.name)
      if (name === 'srcdoc')
        el.removeAttribute(attr.name)
    })
  })
  return doc.body.innerHTML
}
