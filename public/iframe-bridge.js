/**
 * 子应用 iframe 桥接脚本（主应用同源注入，或跨域由子应用自行 <script src> 引入）
 *
 * 能力：
 * - ready / route-change / iframe-resize / breadcrumb 上报
 * - 接收 navigate / auth-token / ping
 *
 * 配置（注入前写入）：
 *   window.__IFRAME_BRIDGE__ = {
 *     targetOrigin: '*',
 *     trustedParentOrigin: 'https://host.example.com', // 校验父消息；缺省尝试 referrer
 *     syncRoute: true,
 *     syncHeight: true,
 *     syncBreadcrumb: true,
 *     tokenStorageKey: 'token', // localStorage JSON: { token }
 *   }
 */
;(function () {
  if (typeof window === 'undefined' || window.parent === window)
    return

  var SOURCE = 'vue3-template-iframe'
  var FLAG = '__IFRAME_BRIDGE_INSTALLED__'
  var KIND = '__IFRAME_BRIDGE_KIND__'
  if (window[FLAG])
    return
  window[FLAG] = true
  window[KIND] = 'script'

  var cfg = window.__IFRAME_BRIDGE__ || {}
  var targetOrigin = cfg.targetOrigin || '*'
  var syncRoute = cfg.syncRoute !== false
  var syncHeight = cfg.syncHeight !== false
  var syncBreadcrumb = cfg.syncBreadcrumb !== false
  var tokenStorageKey = cfg.tokenStorageKey || 'token'
  var syncingFromHost = false
  var resizeTimer = null

  function resolveTrustedParent() {
    if (cfg.trustedParentOrigin === '*')
      return null
    if (cfg.trustedParentOrigin)
      return cfg.trustedParentOrigin
    if (targetOrigin && targetOrigin !== '*')
      return targetOrigin
    try {
      if (location.ancestorOrigins && location.ancestorOrigins.length)
        return location.ancestorOrigins[0]
      if (document.referrer)
        return new URL(document.referrer).origin
    }
    catch (e) { /* ignore */ }
    return null
  }

  var trustedParentOrigin = resolveTrustedParent()

  function isTrustedOrigin(origin) {
    if (!trustedParentOrigin)
      return true
    return origin === trustedParentOrigin
  }

  function post(type, extra) {
    var msg = { source: SOURCE, type: type }
    if (extra) {
      for (var k in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, k))
          msg[k] = extra[k]
      }
    }
    window.parent.postMessage(msg, targetOrigin)
  }

  function currentPath() {
    return location.pathname + location.search + location.hash
  }

  function reportRoute() {
    if (!syncRoute || syncingFromHost)
      return
    post('route-change', { path: currentPath() })
  }

  function reportBreadcrumb() {
    if (!syncBreadcrumb)
      return
    // 优先读显式标记：<meta name="iframe-breadcrumb" content="a,b,c">
    var meta = document.querySelector('meta[name="iframe-breadcrumb"]')
    if (meta && meta.content) {
      var fromMeta = meta.content.split(/[,/|>]/).map(function (s) {
        return s.trim()
      }).filter(Boolean)
      if (fromMeta.length) {
        post('breadcrumb', { data: fromMeta })
        return
      }
    }
    // 其次 data 属性
    var el = document.querySelector('[data-iframe-breadcrumb]')
    if (el && el.getAttribute('data-iframe-breadcrumb')) {
      var fromAttr = el.getAttribute('data-iframe-breadcrumb').split(/[,/|>]/).map(function (s) {
        return s.trim()
      }).filter(Boolean)
      if (fromAttr.length) {
        post('breadcrumb', { data: fromAttr })
        return
      }
    }
    // 回退：document.title 按 - | / 拆分
    var title = (document.title || '').trim()
    if (!title)
      return
    var parts = title.split(/\s*[-|/|>]\s*/).map(function (s) {
      return s.trim()
    }).filter(Boolean)
    if (parts.length)
      post('breadcrumb', { data: parts })
  }

  function reportResize() {
    if (!syncHeight)
      return
    var height = Math.max(
      (document.documentElement && document.documentElement.scrollHeight) || 0,
      (document.body && document.body.scrollHeight) || 0,
    )
    if (height > 0)
      post('iframe-resize', { height: height })
  }

  function scheduleResize() {
    if (resizeTimer)
      clearTimeout(resizeTimer)
    resizeTimer = setTimeout(function () {
      resizeTimer = null
      reportResize()
    }, 100)
  }

  function reportSnapshot() {
    reportRoute()
    reportBreadcrumb()
    reportResize()
  }

  function applyNavigate(path) {
    if (!path || typeof path !== 'string')
      return
    var next = path
    if (next.indexOf('http') === 0) {
      try {
        var u = new URL(next)
        next = u.pathname + u.search + u.hash
      }
      catch (e) { /* ignore */ }
    }
    if (!next || next.charAt(0) !== '/')
      next = '/' + (next || '')
    if (next === currentPath())
      return
    syncingFromHost = true
    try {
      history.pushState(null, '', next)
      window.dispatchEvent(new PopStateEvent('popstate'))
      // hash 路由兼容
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    }
    catch (e) {
      location.assign(next)
    }
    setTimeout(function () {
      syncingFromHost = false
    }, 0)
  }

  function applyToken(token) {
    if (!token || typeof token !== 'string')
      return
    try {
      var raw = localStorage.getItem(tokenStorageKey)
      var data = raw ? JSON.parse(raw) : {}
      if (!data || typeof data !== 'object')
        data = {}
      data.token = token
      localStorage.setItem(tokenStorageKey, JSON.stringify(data))
    }
    catch (e) {
      try {
        localStorage.setItem(tokenStorageKey, token)
      }
      catch (e2) { /* ignore */ }
    }
  }

  function onMessage(event) {
    var data = event.data
    if (!data || data.source !== SOURCE || typeof data.type !== 'string')
      return
    if (!isTrustedOrigin(event.origin))
      return
    if (data.type === 'ping')
      reportSnapshot()
    else if (data.type === 'navigate')
      applyNavigate(data.path)
    else if (data.type === 'auth-token')
      applyToken(data.token)
  }

  // 劫持 history，覆盖大多数 SPA
  ;['pushState', 'replaceState'].forEach(function (fn) {
    var orig = history[fn]
    if (typeof orig !== 'function')
      return
    history[fn] = function () {
      var ret = orig.apply(this, arguments)
      reportRoute()
      reportBreadcrumb()
      scheduleResize()
      return ret
    }
  })

  window.addEventListener('popstate', function () {
    reportRoute()
    reportBreadcrumb()
  })
  window.addEventListener('hashchange', function () {
    reportRoute()
    reportBreadcrumb()
  })
  window.addEventListener('message', onMessage)
  window.addEventListener('resize', scheduleResize)

  if (typeof MutationObserver !== 'undefined' && document.documentElement) {
    var mo = new MutationObserver(function () {
      scheduleResize()
      reportBreadcrumb()
    })
    mo.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-iframe-breadcrumb'],
    })
  }

  // 对外轻量 API，子应用也可手动调用
  window.__iframeBridge = {
    postBreadcrumb: function (items) {
      if (Array.isArray(items))
        post('breadcrumb', { data: items })
    },
    postRoute: reportRoute,
    postResize: reportResize,
  }

  post('ready')
  reportSnapshot()
})()
