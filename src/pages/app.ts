import 'virtual:uno.css'
import '@/assets/scss/main.scss'
import '@/styles/transition/index.css'
import '@/styles/app-shell.css'
import router from '@/router/app'
import App from './App.vue'
import { createBootstrap } from './createBootstrap'

createBootstrap({
  rootComponent: App,
  router,
  mountSelector: '#appApp',
  injectNaiveStyleMeta: true,
})
