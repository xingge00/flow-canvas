<script setup>
import { onBeforeUnmount, ref } from 'vue'
import RenderList from './render/RenderList.vue'
import AddNodeDialog from './render/functionBtn/AddNodeDialog.vue'
import InfoPanel from './InfoPanel'
import CodePanel from './CodePanel'
import useCanvasDrag from './useCanvasDrag'
import useProvideRef from './useProvideRef'
import useShortcutKey from './useShortcutKey'
import OperationStack from './OperationStack'
import { executeCode, generateCode } from './function.js'
import { BaseNode, MIN_BRANCH_COUNT, getParentNode } from './nodeConfig.js'

const nodeList = ref([
  new BaseNode('start'),
  new BaseNode('feat'),
  new BaseNode('if', {
    branchList: [
      [new BaseNode('feat')],
    ],
  }),
  new BaseNode('switch', {
    branchList: [
      [new BaseNode('feat')],
      [new BaseNode('feat')],
      [new BaseNode('feat')],
    ],
  }),
  new BaseNode('end'),
])
window.__nodeList = nodeList

// 添加节点弹窗
const addNodeDialogRef = useProvideRef('addNodeDialogRef')
// hover栈：用于记录当前鼠标悬停的节点
useProvideRef('hoverStack', [])

// 拖动配置
useProvideRef('dragConf', {
  banDropNodeList: [], // 不能被拖动放置的节点
  dragFlag: false, // 是否处于拖动状态
  customDragData: null, // 自定义拖动数据
})

// 选中节点
const activateNode = useProvideRef('activateNode', null)
window.__activateNode = activateNode

onBeforeUnmount(() => {
  window.__activateNode = undefined
  window.__nodeList = undefined
})

// 快捷键处理
const { shortcutKeyFlag } = useShortcutKey(activateNode, true)

// 是否显示分支名
const branchNameFlag = useProvideRef('branchNameFlag', true)

// 执行代码
const execute = () => {
  executeCode(nodeList.value)
}

const code = ref('')
const codePanelRef = ref(null)
// 生成代码
const generate = () => {
  const temp = generateCode(nodeList.value)
  code.value = temp
  codePanelRef.value.show(code.value)
}

// 拖动画板和缩放
const { positionDist, calcDist, scale } = useCanvasDrag('#canvas-main')

// 操作栈
const operationStack = new OperationStack()
</script>

<template>
  <div
    id="canvas-main"
    class="canvas-main"
    v-bind="$attrs"
    :style="{
      '--var-position-x': `${positionDist[0] + calcDist[0]}px`,
      '--var-position-y': `${positionDist[1] + calcDist[1]}px`,
      '--var-position-scale': scale,
    }"
    @click.capture="activateNode = null"
  >
    <div class="left-top-wrapper">
      <el-button @click="shortcutKeyFlag = !shortcutKeyFlag">
        快捷建：{{ shortcutKeyFlag ? '开启' : '关闭' }}
      </el-button>
      <el-button @click="branchNameFlag = !branchNameFlag">
        显示分支名：{{ branchNameFlag ? '开启' : '关闭' }}
      </el-button>
      <el-button @click="execute">
        执行
      </el-button>
      <el-button @click="generate">
        生成代码
      </el-button>
    </div>

    <div class="canvas-node-container">
      <RenderList v-model="nodeList" :start-line="false"></RenderList>
    </div>
  </div>
  <!-- 添加节点弹窗 -->
  <AddNodeDialog
    ref="addNodeDialogRef"
    :scale="scale"
  ></AddNodeDialog>
  <!-- 节点信息面板 -->
  <InfoPanel></InfoPanel>
  <CodePanel ref="codePanelRef" />
</template>

<style lang="scss" scoped>
.canvas-main {
  font-size: 12px;
  width:100%;
  height: 100%;
  padding: 40px 20px;
  box-sizing: border-box;
  background-image: radial-gradient(circle,#e5e9e9 15%,#f8f9f9 10%);
  background-position: center center;
  background-size: 20px 20px;
  position: relative; // 不要删除 用于获取相对画布定位
  overflow: hidden;
  .left-top-wrapper {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 10;
  }
  .canvas-node-container {
    z-index: 1;
    display: inline-block;
    position: relative;
    top: var(--var-position-y);
    left: var(--var-position-x);
    transform: scale(var(--var-position-scale));
    // transform-origin: 50% 50% 0px;
  }
}
</style>
