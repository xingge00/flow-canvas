export const generateCode = (nodeList, deep = 0) => {
  console.log('nodeList', nodeList)

  const SPLIT_STR = '   '
  // 缩进
  const indent = ''.padStart(deep * SPLIT_STR.length, SPLIT_STR)
  const indentPlus = `${SPLIT_STR}${indent}`
  const indentPlusPlus = `${SPLIT_STR}${SPLIT_STR}${indent}`

  const doMap = {
    start: () => `${indent}\n`,
    end: () => `${indent}\n`,
    if: (node) => {
      const { branchList } = node
      const { condition, branchInfoList } = node.nodeInfo
      const trueIdx = branchInfoList.findIndex(i => i.type)
      const falseIdx = branchInfoList.findIndex(i => !i.type)

      const trueCode = generateCode(branchList[trueIdx], deep + 1)
      const falseCode = generateCode(branchList[falseIdx], deep + 1)

      return `${indent}if ( ${condition} ) {${
        trueCode.trim() ? `\n${trueCode}${indent}` : ''
      }} else {${
        falseCode.trim() ? `\n${falseCode}${indent}` : ''
      }}\n`
    },
    switch: (node) => {
      const { branchList } = node
      const { condition, branchInfoList } = node.nodeInfo
      return `${indent}switch ( ${condition} ) {\n${
        branchInfoList.map((branch, idx) =>
          `${indentPlus}case ${branch.condition}:\n${generateCode(branchList[idx], deep + 2) || '\n'}${indentPlusPlus}break;\n`).join('\n')
        }${indent}}\n`
    },
    feat: () => {
      return `${indent}feat();\n`
    },
  }

  const result = nodeList.reduce((acc, cur) => {
    return acc + (doMap[cur.type]?.(cur) || '')
  }, '')
  return result
}
