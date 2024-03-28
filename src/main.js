import { createApp } from 'vue'
import mousetrap from '@/directive/mousetrap.js'

import App from '@/App.vue'
import ElementPlus from 'element-plus'
import locale from 'element-plus/dist/locale/zh-cn.mjs'
import 'element-plus/dist/index.css'
import '@/scss/canvas.scss'

const app = createApp(App)
app.directive('mousetrap', mousetrap)
app.use(ElementPlus, { locale })
app.mount('#app')
