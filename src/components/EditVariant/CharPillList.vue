<!-- 
  PillList component that only allows one unicode character per pill.
 -->

<template>
  <PillList :editable="$props.editable" :validator="validator"
            :starting-pills="$props.startingChars"
            :on-changed="$props.onChanged"/>
</template>

<script setup lang="ts">
  import PillList from "@/components/PillList.vue"

  defineProps<{
    editable: boolean
    startingChars?: string[]
    onChanged?: (chars: string[]) => void
  }>()
  
  function validator(str: string) {
    // Use [...str] because str.length counts the number of UTF-16 code units,
    // while [...str] counts the number of Unicode code points.
    return [...str].length === 1
  }
</script>