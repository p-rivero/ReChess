<template>
  <LocalGame
    :white="'human'"
    :black="'human'"
    :has-gauge="true"
  />
</template>

<script setup lang="ts">
  import LocalGame from '@/components/GameUI/LocalGame.vue'
</script>
