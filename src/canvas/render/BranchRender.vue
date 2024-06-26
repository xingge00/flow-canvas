
<script setup>
import { computed, inject, ref, watch } from 'vue'
import { getColCountByBranch, getColCountByNode } from '../utils'
import AddNodeBtn from './functionBtn/AddNodeBtn'
import RenderList from './RenderList.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  curNode: {
    type: Object,
    default: () => ({}),
  },

})
const emits = defineEmits(['addBranch', 'removeBranch', 'update:modelValue'])
const bindBranch = computed({
  get: () => props.modelValue || [],
  set: val => emits('update:modelValue', val),
})

const branchNameList = computed(() => {
  if (props.curNode?.type === 'switch')
    return (props.curNode?.nodeInfo?.branchInfoList || []).map(i => i?.branchName)
  if (props.curNode?.type === 'if')
    return (props.curNode?.nodeInfo?.branchInfoList || []).map(i => i.branchName)

  return []
})
const colCount = computed(() => getColCountByNode(props.curNode))
const firstBranchColCount = computed(() => getColCountByBranch(bindBranch.value?.[0]))
const lastBranchColCount = computed(() => getColCountByBranch(bindBranch.value?.[bindBranch.value.length - 1]))

const activateNode = inject('activateNode')

const hoverStack = inject('hoverStack')
const curHover = computed(() => hoverStack.value[0])
const mouseenter = idx => hoverStack.value.unshift(bindBranch.value[idx])
const mouseleave = idx => hoverStack.value.shift()

// 拖动抓取
const dragIdx = ref(null)
const dragstart = (idx) => {
  dragIdx.value = idx
  const dragBranch = bindBranch.value[idx]
}
const dragend = () => {
  dragIdx.value = null
}

const dragover = (e) => {
  if (dragIdx.value === null) return
  e.preventDefault()
}

const operationStack = inject('operationStack')
const drop = (idx) => {
  if (dragIdx.value === idx || dragIdx.value === null) return

  operationStack.recallStackPush({
    dataType: 'moveBranch',
    branchList: bindBranch.value,
    node: props.curNode,
    curIdx: dragIdx.value,
    targetIdx: idx,

  })

  dragIdx.value = null
}

const clickNode = (idx) => {
  activateNode.value = bindBranch.value[idx]
}
</script>

<template>
  <div class="line"></div>
  <AddNodeBtn
    v-if="['switch'].includes(curNode.type)"
    class="on-bottom"
    :end-line="false"
    add-type="branch"
    @toAdd="emits('addBranch')"
  ></AddNodeBtn>
  <div
    class="branch-wrapper branch-wrapper-width"
    :style="{
      '--var-col-count': colCount,
      '--var-first-branch-col-count': firstBranchColCount,
      '--var-last-branch-col-count': lastBranchColCount,
    }"
  >
    <RenderList
      v-for="(nodeList, idx) in bindBranch"
      :key="idx"
      v-model="bindBranch[idx]"
      :class="{
        'hover-branch': curHover === bindBranch[idx] || activateNode === bindBranch[idx], // hover或者选中分支高亮
        'can-drop-branch': dragIdx !== null && dragIdx !== idx, // 可以防止的分支
      }"
      :branch-count="bindBranch.length"
      :branch-name="branchNameList[idx]"
      :draggable="true"

      @mouseenter="() => mouseenter(idx)"
      @mouseleave="() => mouseleave(idx)"
      @removeBranch="() => emits('removeBranch', idx)"
      @dragstart.stop="() => dragstart(idx)"
      @dragover="(e) => dragover(e)"
      @drop.capture="() => drop(idx)"
      @dragend="dragend"
      @click.stop="() => clickNode(idx)"
    ></RenderList>
  </div>
</template>

<style lang="scss" scoped>

</style>
