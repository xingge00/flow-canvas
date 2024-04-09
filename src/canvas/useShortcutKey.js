import { onBeforeUnmount, ref, watch } from 'vue'
import Mousetrap from 'mousetrap'
import { MIN_BRANCH_COUNT, getParentNode } from './nodeConfig.js'

export default function (activateNode, initFlag, operationStack) {
  /**
 * 截切版数据
  {type: 'copy',data: null}
 */
  const shearPlate = ref(null)
  const updateShearPlate = val => shearPlate.value = val
  // 剪切
  const toCtrlX = () => {
  // 没有选中节点,进行剪切
    const source = activateNode.value
    if (!source) return
    if (['start', 'end'].includes(source.type)) return

    const { parentNode, branchIdx, nodeList: branchNodeList, nodeIdx } = getParentNode(source)

    if (Array.isArray(source)) {
    // 剪切分支
      if (parentNode.branchList?.length <= MIN_BRANCH_COUNT) {
        throw new Error(`分支数量至少为${MIN_BRANCH_COUNT},剪切失败！`)
      }
      operationStack.recallStackPush({
        dataType: 'shearBranch',
        branchInfo: (parentNode.nodeInfo.branchInfoList).splice(branchIdx, 1)[0],
        branchList: parentNode.branchList,
        node: parentNode,
        targetIdx: branchIdx,
        branch: parentNode.branchList[branchIdx],
        shearPlate,
        updateShearPlate,
      })
    } else {
    // 剪切节点
      operationStack.recallStackPush({
        dataType: 'shearNode',
        node: source,
        targetIdx: nodeIdx,
        nodeList: branchNodeList,
        shearPlate,
        updateShearPlate,
      })
    }
  }
  const toCtrlC = () => {
  // 没有选中节点,不进行复制
    const source = activateNode.value
    if (!source) return
    if (['start', 'end'].includes(source.type)) return

    const { branchIdx, parentNode } = getParentNode()

    shearPlate.value = {
      type: 'copy',
      data: source,
      branchInfo: branchIdx === null ? null : JSON.parse(JSON.stringify(parentNode.nodeInfo.branchInfoList[branchIdx] || {})),
    }
  }
  const toCtrlV = () => {
  // 剪切板没有内容,直接返回
    if (!shearPlate.value) return
    const { type, data, branchInfo } = shearPlate.value
    if (!data) return

    if (['end'].includes(activateNode.value.type)) return

    // 节点处理
    const doMap = {
      copyNode: () => {
        if (!activateNode.value || Array.isArray(activateNode.value)) return
        const { nodeList: branchNodeList, nodeIdx } = getParentNode()
        // branchNodeList.splice(nodeIdx + 1, 0, data.copySelf())
        console.log('data', data)
        operationStack.recallStackPush({
          dataType: 'copyPasteNode',
          nodeList: branchNodeList,
          targetIdx: nodeIdx + 1,
          node: data.copySelf(),
        })
      },
      shearNode: () => {
        if (!activateNode.value || Array.isArray(activateNode.value)) return
        const { nodeList: branchNodeList, nodeIdx } = getParentNode()
        // branchNodeList.splice(nodeIdx + 1, 0, data)
        // // 粘贴完剪切的数据 ,清空剪切板
        // shearPlate.value = null

        operationStack.recallStackPush({
          dataType: 'shearPasteNode',
          nodeList: branchNodeList,
          targetIdx: nodeIdx,
          node: data,
          shearPlate,
          updateShearPlate,
        })
      },

      copyBranch: () => {
      // 选中switch节点,进行粘贴分支
        if (activateNode.value?.type !== 'switch') return

        // 目标位置添加分支
        // const len = activateNode.value.branchList.push(data.map(node => node.copySelf()))
        // // 父节点补充分支信息
        // activateNode.value.nodeInfo.branchInfoList[len - 1] = branchInfo

        operationStack.recallStackPush({
          dataType: 'copyPasteBranch',
          branchInfo: JSON.parse(JSON.stringify(branchInfo)),
          node: activateNode.value,
          branch: data.map(node => node.copySelf()),
        })
      },
      shearBranch: () => {
      // 选中switch节点,进行粘贴分支
        if (activateNode.value?.type !== 'switch') return
        operationStack.recallStackPush({
          dataType: 'shearPasteBranch',
          branch: data,
          branchList: activateNode.value.branchList,
          node: activateNode.value,
          branchInfo,
          shearPlate,
          updateShearPlate,
        })
      },
    }

    const doType = type + (Array.isArray(data) ? 'Branch' : 'Node')

    doMap[doType]()
  }

  const toCtrlZ = () => operationStack.handleRecall()
  const toCtrlY = () => operationStack.handleRecover()

  // 是否使用快捷键
  const shortcutKeyFlag = ref(initFlag)
  const keyMap = {
    'mod+x': toCtrlX,
    'mod+c': toCtrlC,
    'mod+v': toCtrlV,
    'mod+z': toCtrlZ,
    'mod+y': toCtrlY,
  }

  const toBind = () => {
    Object.entries(keyMap).forEach(([key, fn]) => {
      Mousetrap.bind(key, fn)
    })
  }
  const toUnbind = () => {
    Object.keys(keyMap).forEach((key) => {
      Mousetrap.unbind(key)
    })
  }

  watch(
    () => shortcutKeyFlag.value,
    val => val ? toBind() : toUnbind(),
    { immediate: true },
  )
  onBeforeUnmount(toUnbind)

  return {
    shortcutKeyFlag,
  }
}
