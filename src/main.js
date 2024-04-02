import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import locale from 'element-plus/dist/locale/zh-cn.mjs'
import App from '@/App.vue'

import 'element-plus/dist/index.css'
import '@/scss/canvas.scss'

const app = createApp(App)
app.use(ElementPlus, { locale })
app.mount('#app')
