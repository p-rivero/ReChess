<template>
  <BoardWithGui ref="board"
    :white="startAs === 'white' ? 'human' : 'engine'"
    :black="startAs === 'black' ? 'human' : 'engine'"
    :has-gauge="false" @game-over="gameOver" />
</template>

<script setup lang="ts">
  import BoardWithGui from '@/components/GameUI/BoardWithGui.vue'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import { useVariantStore } from '@/stores/variant'
  import { ref, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { getMessage } from '@/utils/chess/game-over-message'
  import { showPopupImportant } from '@/components/Popup/popup-manager';
  import type { GameState, MakeMoveFlag, MakeMoveWinner, Player } from '@/protochess/types'
  import { getProtochess } from '@/protochess'
  
  const router = useRouter()
  const route = useRoute()
  
  const board = ref<InstanceType<typeof BoardWithGui>>()
  const startAs: Player = chooseColor()
  let messageShown = false
    
  onMounted(async () => {
    const protochess = await getProtochess()
    const state = await getState()
    if (!state) return
    // Set the board state and make sure it's valid
    board.value?.setState(state)
    try {
      await protochess.validatePosition()
    } catch (e) {
      console.error(e)
      // Invalid position, redirect to home page
      router.push({ name: 'home' })
    }
  })
  
  
  // Decide which color to play as, based on the 'startAs' query parameter
  function chooseColor(): Player {
    const DEFAULT_COLOR = 'white'
    if (!route.query.startAs || typeof route.query.startAs !== 'string') {
      return DEFAULT_COLOR
    }
    if (route.query.startAs === 'white' || route.query.startAs === 'black') {
      return route.query.startAs
    }
    if (route.query.startAs === 'random') {
      return Math.random() < 0.5 ? 'white' : 'black'
    }
    // Invalid value
    return DEFAULT_COLOR
  }
  
  // If the variantId parameter is missing, use the stored draft variant
  async function getState(): Promise<GameState|undefined> {
    const variantId = route.params.variantId
    if (variantId && typeof variantId === 'string') {
      return getStateFromServer(variantId)
    }
    const draftStore = useVariantDraftStore()
    const draft = draftStore.state
    return draft
  }
  async function getStateFromServer(id: string): Promise<GameState|undefined> {
    const variantStore = useVariantStore()
    const variant = await variantStore.getVariant(id)
    // Variant ID is incorrect (or the uploader of this variant is malicious), redirect to home page
    if (!variant) {
      router.push({ name: 'home' })
      return
    }
    return variant
  }
  
  function gameOver(flag: MakeMoveFlag, winner: MakeMoveWinner, playerToMove: Player) {
    const title =
      winner === 'white' ? 'White wins!' :
      winner === 'black' ? 'Black wins!' :
      'It\'s a Draw!'
    const message = getMessage(flag, playerToMove)
    if (messageShown) return
    showPopupImportant(title, message, 'ok')
    messageShown = true
  }
</script>
