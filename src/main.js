import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import locale from 'element-plus/dist/locale/zh-cn.mjs'
import hljsVuePlugin from '@highlightjs/vue-plugin'
import App from '@/App.vue'
import mousetrap from '@/directive/mousetrap.js'

import 'element-plus/dist/index.css'
import 'highlight.js/styles/stackoverflow-light.css'
import 'highlight.js/lib/common'
import '@/scss/canvas.scss'

const app = createApp(App)

app.directive('mousetrap', mousetrap)
app.use(ElementPlus, { locale })
app.use(hljsVuePlugin)
app.mount('#app')
