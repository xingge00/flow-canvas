import { computed, ref } from 'vue'
import { swapMove } from './utils'
/**
 * recallData.dataType:[
 *  'addNode', 'addBranch',
 *  'deleteNode', 'deleteBranch',
 *  'moveNode', 'moveBranch',
 *  'copyPasteNode', 'copyPasteBranch',
 *  'shearNode', 'shearBranch',
 *  'shearPasteNode', 'shearPasteBranch',
 *  ]
 */
const handleFn = (recallData, doType = 'recall', cb = () => {}) => {
  const {
    dataType,
    node,
    branch,
    nodeList,
    curIdx,
    branchList,
    branchInfo,
    targetIdx,
    targetNodeList,
    shearPlate,
    updateShearPlate,
  } = recallData

  const doMap = {
    // 添加节点
    addNode: {
      recall: () => { nodeList.splice(targetIdx, 1) },
      recover: () => { nodeList.splice(targetIdx, 0, node) },
    },
    // 添加分支
    addBranch: {
      recall: () => {
        const idx = branchList.length - 1
        branchList.splice(idx, 1)
        // 撤销时将分支信息缓存到操作栈数据中
        recallData.branchInfo = node.nodeInfo.branchInfoList[idx]
        node.nodeInfo.branchInfoList.splice(idx, 1)
      },
      recover: () => {
        const idx = branchList.push(branch)
        node.nodeInfo.branchInfoList[idx - 1] = branchInfo
      },
    },
    // 删除节点
    deleteNode: {
      recall: () => { nodeList.splice(targetIdx, 0, node) },
      recover: () => { nodeList.splice(targetIdx, 1) },
    },
    // 删除分支
    deleteBranch: {
      recall: () => {
        branchList.splice(targetIdx, 0, branch)
        node.nodeInfo.branchInfoList[targetIdx] = branchInfo
      },
      recover: () => {
        recallData.branchInfo = node.nodeInfo.branchInfoList[targetIdx]
        branchList.splice(targetIdx, 1)
        node.nodeInfo.branchInfoList.splice(targetIdx, 1)
      },
    },
    // 移动节点
    moveNode: {
      recall: () => {
        // 同一条分支节点移动
        if (nodeList === targetNodeList) {
          if (curIdx > targetIdx) {
            nodeList.splice(targetIdx + 1, 1)
            nodeList.splice(curIdx, 0, node)
          } else {
            nodeList.splice(curIdx, 0, node)
            nodeList.splice(targetIdx + 1, 1)
          }
        } else {
          targetNodeList.splice(targetIdx - 1, 1)
          nodeList.splice(curIdx, 0, node)
        }
      },
      recover: () => {
        // 同一条分支节点移动
        if (nodeList === targetNodeList) {
          if (curIdx > targetIdx) {
            nodeList.splice(curIdx, 1)
            nodeList.splice(targetIdx + 1, 0, node)
          } else {
            nodeList.splice(targetIdx + 1, 0, node)
            nodeList.splice(curIdx, 1)
          }
        } else {
          nodeList.splice(curIdx, 1)
          targetNodeList.splice(targetIdx + 1, 0, node)
        }
      },
    },
    // 移动分支
    moveBranch: {
      recall: () => {
        // 更新分支顺序
        swapMove(branchList, targetIdx, curIdx)
        // 更新父节点分支信息
        swapMove(node?.nodeInfo?.branchInfoList || [], targetIdx, curIdx)
      },
      recover: () => {
        swapMove(branchList, curIdx, targetIdx)
        swapMove(node?.nodeInfo?.branchInfoList || [], curIdx, targetIdx)
      },
    },
    // 截切节点
    shearNode: {
      recall: () => {
        nodeList.splice(targetIdx, 0, node)
        updateShearPlate(recallData.preSharePlate)
      },
      recover: () => {
        nodeList.splice(targetIdx, 1)
        recallData.preSharePlate = shearPlate?.value ? { ...shearPlate.value } : null
        updateShearPlate({
          type: 'shear',
          data: node,
        })
      },
    },
    // 粘贴节点（剪切）
    shearPasteNode: {
      recall: () => {
        nodeList.splice(targetIdx + 1, 1)
        updateShearPlate(recallData.preSharePlate)
      },
      recover: () => {
        nodeList.splice(targetIdx + 1, 0, node)
        recallData.preSharePlate = shearPlate?.value ? { ...shearPlate.value } : null
        // 粘贴完剪切的数据 ,清空剪切板
        updateShearPlate(null)
      },
    },
    // 截切分支
    shearBranch: {
      recall: () => {
        branchList?.splice(targetIdx, 0, branch)
        node.nodeInfo.branchInfoList?.splice(targetIdx, 0, branchInfo)
        updateShearPlate(recallData.preSharePlate)
      },
      recover: () => {
        branchList?.splice(targetIdx, 1)
        recallData.preSharePlate = shearPlate?.value ? { ...shearPlate.value } : null
        updateShearPlate({
          type: 'shear',
          data: branch,
          branchInfo,
        })
      },
    },
    // 粘贴分支（剪切）
    shearPasteBranch: {
      recall: () => {
        branchList.pop()
        updateShearPlate(recallData.preSharePlate)
      },
      recover: () => {
        const len = branchList.push(branch)
        node.nodeInfo.branchInfoList[len - 1] = branchInfo
        recallData.preSharePlate = shearPlate?.value ? { ...shearPlate.value } : null
        // 粘贴完剪切的数据 ,清空剪切板
        updateShearPlate(null)
      },
    },
    // 粘贴节点（复制）
    copyPasteNode: {
      recall: () => {
        nodeList.splice(targetIdx, 1)
      },
      recover: () => {
        nodeList.splice(targetIdx, 0, node)
      },
    },
    // 粘贴分支（复制）
    copyPasteBranch: {
      recall: () => {
        node.branchList.pop()
        node.nodeInfo.branchInfoList.splice(node.branchList.length, 1)
      },
      recover: () => {
        const len = node.branchList.push(branch)
        node.nodeInfo.branchInfoList[len - 1] = branchInfo
      },
    },

  }

  if (!doMap[dataType]) {
    console.error('dataType 错误:', dataType)
    return false
  }
  if (!doMap[dataType][doType]) {
    console.error('doType 错误:', doType)
    return false
  }
  doMap[dataType][doType]()
  cb()
  return true
}

export default function useOperationStack(cb = () => {}) {
  const recallStackMaxLength = 100
  const recallStack = ref([])
  const recallStackIndex = ref(-1)

  const canRecall = computed(() => !!(recallStack.value.length && recallStackIndex.value >= 0))
  const canRecover = computed(() => !!(recallStack.value.length && recallStackIndex.value < recallStack.value.length - 1))

  const getLength = () => { // 操作栈长度
    return recallStack.value.length
  }

  const recallStackPush = (recallData) => {
    // 新操作入栈，清除恢复记录
    if (getLength() - 1 > recallStackIndex.value) {
      recallStack.value.splice(recallStackIndex.value + 1, getLength() - recallStackIndex.value - 1)
    }
    // 操作栈满了，删除最早的操作
    if (recallStackIndex.value >= recallStackMaxLength - 1) {
      recallStack.value.shift()
    }

    recallStackIndex.value = recallStack.value.push(recallData) - 1
    const pushSuccess = handleFn(recallData, 'recover', cb)
    if (!pushSuccess) {
      recallStack.value.pop()
      recallStackIndex.value--
    }
    return pushSuccess
  }

  /** 撤回操作 */
  const handleRecall = () => {
    if (recallStackIndex.value < 0) return console.error('操作栈为空, 无法撤回')
    const recallData = recallStack.value[recallStackIndex.value]
    // handleRealRecall(operation)
    handleFn(recallData, 'recall', cb)

    recallStackIndex.value -= 1
    return recallData
  }

  /** 恢复操作 */
  const handleRecover = () => {
    if (recallStackIndex.value >= getLength() - 1) return console.error('操作栈为空, 无法恢复')

    recallStackIndex.value += 1
    const recallData = recallStack.value[recallStackIndex.value]
    handleFn(recallData, 'recover', cb)
    return recallData
  }

  return {
    canRecall, // 能否撤回
    canRecover, // 能否恢复
    getLength, // 获取栈长度
    recallStackPush, // 操作入栈
    handleRecall, // 撤回操作
    handleRecover, // 恢复操作
  }
}
