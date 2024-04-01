
<script setup>
import { onMounted, ref } from 'vue'
import { ClickOutside as vClickOutside } from 'element-plus'
import { getHighlighter } from 'shiki'
import { copyToClipboard } from '../utils/index.js'
// 面板宽度
const PANEL_WIDTH = '500px'

let highlighter
onMounted(async () => {
  // 预加载
  highlighter = getHighlighter({
    langs: ['javascript'],
    themes: ['slack-dark'],
  })
})

const visible = ref(false)
const code = ref('')
const html = ref('')
const show = async (text) => {
  visible.value = true

  html.value = (await highlighter).codeToHtml(text, {
    lang: 'javascript',
    theme: 'slack-dark',
  })
  code.value = text
}

const close = () => {
  visible.value = false
}

const copy = (text) => {
  copyToClipboard(text)
}

defineExpose({
  show,
})
</script>

<template>
  <div
    v-click-outside="close"
    :style="{
      '--var-width': PANEL_WIDTH,
      '--var-right': visible ? 0 : `-${PANEL_WIDTH}`,
      '--var-opacity': Number(visible),
    }"
    class="custom-drawer"
  >
    <el-button link type="primary" @click="() => copy(code)">
      复制代码
    </el-button>

    <div class="code-panel" v-html="html"></div>
  </div>
</template>

<style lang="scss" scoped>
.custom-drawer {
  position: fixed;
  top: 0;
  max-width:65%;
  right: var(--var-right);
  width: var(--var-width);
  opacity: var(--var-opacity);
  height: 100vh;
  background-color: #fff;
  transition: all .15s ease;
  z-index: 99999;
  padding: 10px;
  box-sizing: border-box;
  box-shadow: -2px 0 8px rgba(0, 0, 0, .15);
  .code-panel {
    overflow: auto;
    height: calc(100% - 20px);
    :deep(pre) {
      padding-left: 10px;
      .line {
        background-color: initial;
      }
    }
  }
}
</style>
