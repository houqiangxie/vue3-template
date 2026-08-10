import 'virtual:uno.css'
import '@/assets/scss/main.scss'
import '@/styles/transition/index.css'
import router from '@/router/web'
import App from './WebApp.vue'
import { createBootstrap } from './createBootstrap'

createBootstrap({
  rootComponent: App,
  router,
  mountSelector: '#webApp',
  injectNaiveStyleMeta: true,
})
