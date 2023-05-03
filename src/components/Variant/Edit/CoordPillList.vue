<!--
  PillList component that only allows board coordinates as pills. Example: "a1", "c2", "a11", "p16"
 -->

<template>
  <PillList
    :editable="editable"
    :validator="validator"
    :starting-pills="startingPills"
    :allow-repeat="allowRepeat"
    @changed="onChanged"
  />
</template>

<script setup lang="ts">
  import { coordsToPair, isCoords, pairToCoords } from '@/utils/chess/chess-coords'
  import PillList from '@/components/PillList.vue'

  const props = defineProps<{
    editable: boolean
    startingCoords?: [number, number][]
    allowRepeat?: boolean
  }>()
  
  const emit = defineEmits<{
    (event: 'changed', coords: [number, number][]): void
  }>()
  
  const startingPills = props.startingCoords?.map((coord) => pairToCoords(coord))
  
  function validator(str: string) {
    return isCoords(str)
  }
  
  function onChanged(pills: string[]) {
    const coords = pills.map((pill) => coordsToPair(pill))
    emit('changed', coords)
  }
</script>
