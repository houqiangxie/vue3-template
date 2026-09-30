import 'virtual:uno.css'
import '@/assets/scss/main.scss'
import '@/styles/transition/index.css'
import '@/styles/app-shell.css'

import router from '@/router/bpm'
import App from './BpmApp.vue'
import { createBootstrap } from './createBootstrap'

createBootstrap({
  rootComponent: App,
  router,
  mountSelector: '#bpmApp',
  injectNaiveStyleMeta: true,
})
