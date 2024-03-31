import { onBeforeUnmount, ref, watch } from 'vue'
import Mousetrap from 'mousetrap'
import { MIN_BRANCH_COUNT, getParentNode } from './nodeConfig.js'

export default function (activateNode, initFlag) {
  /**
 * 截切版数据
  {type: 'copy',data: null}
 */
  const shearPlate = ref(null)
  // 剪切
  const toCtrlX = () => {
  // 没有选中节点,进行剪切
    const source = activateNode.value
    if (!source) return
    if (['start', 'end'].includes(source.type)) return

    const { parentNode, branchIdx, nodeList: branchNodeList, nodeIdx } = getParentNode(source)

    let branchInfo = null
    if (Array.isArray(source)) {
    // 剪切分支
      if (parentNode.branchList?.length <= MIN_BRANCH_COUNT) {
        throw new Error(`分支数量至少为${MIN_BRANCH_COUNT},剪切失败！`)
      }

      (parentNode.branchList || []).splice(branchIdx, 1)
      branchInfo = (parentNode.nodeInfo.branchInfoList).splice(branchIdx, 1)[0]
    } else {
    // 剪切节点
      branchNodeList.splice(nodeIdx, 1)
    }

    shearPlate.value = {
      type: 'shear',
      data: source,
      branchInfo,

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
        branchNodeList.splice(nodeIdx + 1, 0, data.copySelf())
      },
      shearNode: () => {
        if (!activateNode.value || Array.isArray(activateNode.value)) return
        const { nodeList: branchNodeList, nodeIdx } = getParentNode()
        branchNodeList.splice(nodeIdx + 1, 0, data)
        // 粘贴完剪切的数据 ,清空剪切板
        shearPlate.value = null
      },

      copyBranch: () => {
      // 选中switch节点,进行粘贴分支
        if (activateNode.value?.type !== 'switch') return

        // 目标位置添加分支
        const len = activateNode.value.branchList.push(data.map(node => node.copySelf()))
        // 父节点补充分支信息
        activateNode.value.nodeInfo.branchInfoList[len - 1] = branchInfo
      },
      shearBranch: () => {
      // 选中switch节点,进行粘贴分支
        if (activateNode.value?.type !== 'switch') return
        const len = activateNode.value.branchList.push(data)
        activateNode.value.nodeInfo.branchInfoList[len - 1] = branchInfo
        // 粘贴完剪切的数据 ,清空剪切板
        shearPlate.value = null
      },
    }

    const doType = type + (Array.isArray(data) ? 'Branch' : 'Node')

    doMap[doType]()
  }

  // 是否使用快捷键
  const shortcutKeyFlag = ref(initFlag)
  const keyMap = {
    'mod+x': toCtrlX,
    'mod+c': toCtrlC,
    'mod+v': toCtrlV,
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
