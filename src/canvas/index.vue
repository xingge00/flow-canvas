<script setup>
import { Aim, CollectionTag, Cpu, MagicStick, Refresh, RefreshLeft, RefreshRight, VideoPlay } from '@element-plus/icons-vue'
import { onBeforeUnmount, provide, ref, toRef } from 'vue'
import RenderList from './render/RenderList.vue'
import AddNodeDialog from './render/functionBtn/AddNodeDialog.vue'
import InfoPanel from './InfoPanel'
import CodePanel from './CodePanel'
import useCanvasDrag from './useCanvasDrag'
import useProvideRef from './useProvideRef'
import useShortcutKey from './useShortcutKey'
import useOperationStack from './useOperationStack'
import useWindowChange from './useWindowChange'
import { executeCode, generateCode } from './function.js'
import { BaseNode, parse, stringify } from './nodeConfig.js'

const getDefaultNodeList = () => [
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
      [],
    ],
  }),
  new BaseNode('end'),
]
const nodeList = ref([])
const temp = localStorage.getItem('nodeList')
if (temp) {
  nodeList.value = parse(temp)
} else {
  nodeList.value = getDefaultNodeList()
}

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
// const execute = () => {
//   executeCode(nodeList.value)
// }

const code = ref('')
const codePanelRef = ref(null)
// 生成代码
const generate = () => {
  const temp = generateCode(nodeList.value)
  code.value = temp
  codePanelRef.value.show(code.value)
}

// 拖动画板和缩放
const { positionDist, calcDist, scale, reset: positionReset } = useCanvasDrag('#canvas-main', true)

// 重置
const reset = () => {
  positionReset()
  nodeList.value = getDefaultNodeList()
}

// 操作栈
const operationStack = useOperationStack(() => {
  localStorage.setItem('nodeList', stringify(nodeList.value))
})
provide('operationStack', operationStack)
const { canRecall, canRecover } = operationStack

const isSmall = ref(false)
useWindowChange(() => {
  isSmall.value = window.innerWidth < 700
})
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
    <div class="top-wrapper">
      <div class="left-top-wrapper">
        <el-button title="快捷建" :type="shortcutKeyFlag ? 'success' : 'danger'" @click="shortcutKeyFlag = !shortcutKeyFlag">
          <el-icon><MagicStick /></el-icon>
          <template v-if="!isSmall">
            快捷建：{{ shortcutKeyFlag ? '开启' : '关闭' }}
          </template>
        </el-button>
        <el-button title="显示分支名" :type="branchNameFlag ? 'success' : 'danger'" @click="branchNameFlag = !branchNameFlag">
          <el-icon><CollectionTag /></el-icon>
          <template v-if="!isSmall">
            显示分支名：{{ branchNameFlag ? '开启' : '关闭' }}
          </template>
        </el-button>
        <!-- <el-button title="执行" @click="execute">
          <el-icon><VideoPlay /></el-icon>
          <template v-if="!isSmall">
            执行
          </template>
        </el-button> -->
        <el-button title="生成代码" @click="generate">
          <el-icon><Cpu /></el-icon>
          <template v-if="!isSmall">
            生成代码
          </template>
        </el-button>
      </div>
      <div class="right-top-wrapper">
        <el-button title="重置" @click="reset">
          <el-icon><Refresh /></el-icon>
        </el-button>
        <el-button title="复位" @click="positionReset">
          <el-icon><Aim /></el-icon>
        </el-button>
        <el-button title="撤销" :disabled="!canRecall" @click="() => operationStack.handleRecall()">
          <el-icon><RefreshLeft /></el-icon>
        </el-button>
        <el-button title="恢复" :disabled="!canRecover" @click="() => operationStack.handleRecover()">
          <el-icon><RefreshRight /></el-icon>
        </el-button>
      </div>
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
  .top-wrapper {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 10;
    width: 100%;
    background-color: #fff;
    padding: 10px;
    box-sizing: border-box;
    .left-top-wrapper {
      float: left;
      // margin-right: 12px;
    }
    .right-top-wrapper {
      float: right;
    }
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
