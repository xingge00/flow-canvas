import { ElMessage } from 'element-plus'
// eslint-disable-next-line import/no-mutable-exports
export let copyToClipboard = (text) => {
  const execCommandCopy = (text) => {
    if (!text) {
      return console.error('复制内容为空')
    }

    const input = document.createElement('textarea')
    try {
      input.setAttribute('readonly', 'readonly')
      input.value = text.replace(/\n/g, '\r') /// n的换行会丢失
      input.value = text /// n的换行会丢失
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      ElMessage.success('复制成功!')
    } catch (e) {
      console.error('自动复制被禁用，请手动选取复制')
    }
  }

  const navigatorCopy = (text) => {
    if (!text) {
      return console.log('复制内容为空')
    }
    try {
      navigator.clipboard.writeText(text).then(
        () => {
          ElMessage.success('复制成功')
        },
        () => {
          execCommandCopy(text)
        },
      )
    } catch (e) {
      execCommandCopy(text)
      console.error('不支持异步剪切板:', e)
    }
  }

  // 重写函数，避免函数执行重复性判断
  copyToClipboard = !navigator.clipboard ? execCommandCopy : navigatorCopy

  copyToClipboard(text)
}

// 获取当前节点占用列数
export const getColCountByNode = (node) => {
  if (!node) return 0
  if (!(node?.branchList?.length)) return 1

  return node.branchList.reduce((acc, cur) =>
    acc + Math.max(...cur.map(i => getColCountByNode(i)), 1)
  , 0)
}

// 获取分支得列数
export const getColCountByBranch = (branch) => {
  if (!Array.isArray(branch)) return 1
  return Math.max(...branch.map(i => getColCountByNode(i)), 1)
}
