<!--
  PillList component that only allows one unicode character per pill.
 -->

<template>
  <PillList
    :editable="$props.editable"
    :validator="validator"
    :starting-pills="$props.startingChars"
    :allow-repeat="$props.allowRepeat"
    @changed="pills => emit('changed', pills)"
  />
</template>

<script setup lang="ts">
  import PillList from '@/components/PillList.vue'

  defineProps<{
    editable: boolean
    startingChars?: string[]
    allowRepeat: boolean
  }>()
  
  const emit = defineEmits<{
    (event: 'changed', chars: string[]): void
  }>()
  
  
  function validator(str: string) {
    // Use [...str] because str.length counts the number of UTF-16 code units,
    // while [...str] counts the number of Unicode code points.
    return [...str].length === 1
  }
</script>
