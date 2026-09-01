import 'virtual:uno.css'
import '@/assets/scss/main.scss'
import '@/styles/transition/index.css'
import '@/styles/app-shell.css'
import router from '@/router/web'
import App from './WebApp.vue'
import { createBootstrap } from './createBootstrap'
import projectSetting from '@/settings/projectSetting'
import { setupBodyZoomCompensation } from '@/utils/bodyZoom'

/** 抵消显示器 / 浏览器缩放：DPR=3 → body.zoom=1/3（vite 插件修正 vueuc 浮层） */
setupBodyZoomCompensation({
  enabled: projectSetting.bodyZoomCompensation,
})

createBootstrap({
  rootComponent: App,
  router,
  mountSelector: '#webApp',
  injectNaiveStyleMeta: true,
})
