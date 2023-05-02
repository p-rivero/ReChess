<template>
  <LocalGame
    :white="'human'"
    :black="'human'"
    :has-gauge="true"
    :allow-branching="true"
    @new-move="modified = true"
  />
</template>

<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref } from 'vue'
  import LocalGame from '@/components/GameUI/LocalGame.vue'
  
  const modified = ref(false)
  
  function beforeUnloadListener(e: BeforeUnloadEvent) {
    if (modified.value) {
      e.preventDefault()
    }
  }
  onMounted(() => window.addEventListener('beforeunload', beforeUnloadListener))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnloadListener))
</script>
