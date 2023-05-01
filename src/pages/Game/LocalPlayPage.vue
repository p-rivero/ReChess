<template>
  <LocalGame
    :white="startAs === 'white' ? 'human' : otherPlayer"
    :black="startAs === 'black' ? 'human' : otherPlayer"
    :invert-enemy-direction="otherPlayer === 'human'"
    :update-title="otherPlayer !== 'human'"
    :show-game-over-popup="true"
    :opponent-name="otherPlayer === 'engine' ? `Engine level ${engineLevel}` : 'Anonymous'"
    :engine-level="engineLevel"
  />
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useRoute } from 'vue-router'
  import LocalGame from '@/components/GameUI/LocalGame.vue'
  import type { Player } from '@/protochess/types'
  
  const route = useRoute()
  const startAs: Player = chooseColor()
  const otherPlayer: 'human' | 'engine' = route.query.mode === 'otb' ? 'human' : 'engine'
  
  const engineLevel = ref<1|2|3|4|5>(5)
  const parsedLevel = Number(route.query.lvl)
  if ([1, 2, 3, 4, 5].includes(parsedLevel)) {
    engineLevel.value = parsedLevel as 1|2|3|4|5
  }
  
  // Decide which color to play as, based on the 'startAs' query parameter
  function chooseColor(): Player {
    const DEFAULT_COLOR = 'white'
    if (route.query.startAs === 'white' || route.query.startAs === 'black') {
      return route.query.startAs
    }
    if (route.query.startAs === 'random') {
      return Math.random() < 0.5 ? 'white' : 'black'
    }
    // Invalid value
    return DEFAULT_COLOR
  }
  
</script>
