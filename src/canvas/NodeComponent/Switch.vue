
<script setup>
import { computed, inject } from 'vue'
import BranchRender from '../render/BranchRender.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  isPreview: {
    type: Boolean,
    default: false,
  },
})
const emits = defineEmits(['update:modelValue'])
const bindBranch = computed({
  get: () => props.modelValue.branchList || [],
  set: val => emits('update:modelValue', { ...props.modelValue, branchList: val }),
})

const operationStack = inject('operationStack')

const addBranch = () => {
  const newBranch = []
  const newBranchInfo = {}
  operationStack.recallStackPush({
    dataType: 'addBranch',
    node: props.modelValue,
    branchList: bindBranch.value,
    branch: newBranch,
    branchInfo: newBranchInfo,
  })
}

const removeBranch = (idx) => {
  // bindBranch.value.splice(idx, 1)
  // // eslint-disable-next-line vue/no-mutating-props
  // props.modelValue.nodeInfo.branchInfoList.splice(idx, 1)

  operationStack.recallStackPush({
    dataType: 'deleteBranch',
    node: props.modelValue,
    branch: bindBranch.value[idx],
    branchList: bindBranch.value,
    targetIdx: idx,
    branchInfo: null,
  })
}
</script>

<template>
  <div class="node-wrapper" v-bind="$attrs">
    <slot></slot>
    <div class="c-circle c-switch">
      <slot name="showName">
        switch
      </slot>
    </div>
  </div>
  <BranchRender
    v-if="!isPreview"
    v-model="bindBranch"
    :cur-node="modelValue"
    @addBranch="addBranch"
    @removeBranch="removeBranch"
  ></BranchRender>
</template>

<style lang="scss" scoped>
.node-wrapper {
  position: relative;
  :deep(.on-bottom) {
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
  }
}
</style>
