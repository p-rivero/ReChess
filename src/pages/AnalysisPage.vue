<template>
  <BoardWithGui :white="'human'" :black="'human'" :has-gauge="true" />
</template>

<script setup lang="ts">
  import BoardWithGui from '@/components/GameUI/BoardWithGui.vue'
</script>
