/**
 * 跨端错误提示：web 用 Naive $message，app 按需加载 Vant toast
 * 避免 web 入口静态依赖 vant
 */

let vantFailToast: ((msg: string) => void) | null = null

async function loadVantToast() {
  if (vantFailToast)
    return vantFailToast
  const mod = await import('vant')
  vantFailToast = (msg: string) => mod.showFailToast(msg)
  return vantFailToast
}

function isAppEntry() {
  return typeof location !== 'undefined' && location.pathname.includes('app')
}

export function showRequestError(message: string) {
  if (!message)
    return
  if (isAppEntry()) {
    void loadVantToast().then(toast => toast(message)).catch(() => {
      console.error(message)
    })
    return
  }
  window.$message?.error(message)
}
