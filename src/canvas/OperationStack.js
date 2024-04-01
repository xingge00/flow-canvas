function handleRealRecall({ type, node, nodeList, index }) {
  switch (type) {
    case 'addNode':
    case 'addBranch':
      nodeList.splice(index, 1)
      break

    case 'deleteNode':
    case 'deleteBranch':
      nodeList.splice(index, 0, node)
      break

    case 'restNodeList':
      node.$emit('update:nodeList', nodeList)
      break

    default:
      console.error('错误，没有匹配到操作类型')
      break
  }
}

function handleRealRecover({ type, node, nodeList, index }) {
  switch (type) {
    case 'addNode':
    case 'addBranch':
      nodeList.splice(index, 0, node)
      break

    case 'deleteNode':
    case 'deleteBranch':
      nodeList.splice(index, 1)
      break

    case 'restNodeList':
      node.$emit('restNodeList')
      break

    default:
      console.error('错误，没有匹配到操作类型')
      break
  }
//   console.log('恢复操作')
//   console.log('执行操作', { type, node, nodeList, index })
//   console.log('curIndex', this.#recallStackIndex)
}

export default class {
  #recallStack = []// 操作栈
  #recallStackIndex = -1 // 操作栈索引
  #saveStatus = true // 保存状态

  constructor() {
    this.recallStackMaxLength = 50 // 操作栈最大长度
  }

  getLength() { // 操作栈长度
    return this.#recallStack.length
  }

  /**
   * @param { operation } data
   *  例：
   *   {
   *      type: 'addNode',
   *      node,
   *      nodeList,
   *      index
   *   }
   * @returns
   */
  recallStackPush(data) {
    // 新操作入栈，清除恢复记录
    if (this.getLength() - 1 > this.#recallStackIndex) {
      this.#recallStack.splice(this.#recallStackIndex + 1, this.getLength() - this.#recallStackIndex - 1)
    }
    // 操作栈满了，删除最早的操作
    if (this.#recallStackIndex >= this.recallStackMaxLength - 1) {
      this.#recallStack.shift()
    }
    this.#recallStackIndex = this.#recallStack.push(data) - 1
    // console.log('this.#recallStack', this.#recallStack)
  }

  /** 撤回操作 */
  handleRecall() {
    if (this.#recallStackIndex < 0) {
      console.error('操作栈为空, 无法撤回')
      return
    }

    // 将状态标记为未保存
    this.#saveStatus = false

    const operation = this.#recallStack[this.#recallStackIndex]
    handleRealRecall(operation)

    this.#recallStackIndex -= 1
    return operation
  }

  /** 恢复操作 */
  handleRecover() {
    if (this.#recallStackIndex >= this.getLength() - 1) {
      console.error('操作栈为空, 无法恢复')
      return
    }

    // 将状态标记为未保存
    this.#saveStatus = false

    this.#recallStackIndex += 1
    const operation = this.#recallStack[this.#recallStackIndex]
    handleRealRecover(operation)
    return operation
  }

  // 更新保存状态
  updateSaveStatus(data) {
    this.#saveStatus = data
  }
}
