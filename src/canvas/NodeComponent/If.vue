
<script setup>
import { computed } from 'vue'
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
  get: () => props.modelValue.branchList,
  set: val => emits('update:modelValue', { ...props.modelValue, branchList: val }),
})
</script>

<template>
  <div class="node-wrapper" v-bind="$attrs">
    <slot></slot>
    <div class="c-circle c-if">
      <slot name="showName">
        if
      </slot>
    </div>
  </div>
  <BranchRender
    v-if="!isPreview"
    v-model="bindBranch"
    :cur-node="modelValue"
  ></BranchRender>
</template>

<style lang="scss" scoped>

</style>
