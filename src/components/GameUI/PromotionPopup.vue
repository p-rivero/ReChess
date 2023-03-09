<template>
  <div v-show="active" class="promotion-overlay" @click="active = false">
    <div class="promotion-picker">
      <div v-for="(url, index) of promotionUrls" class="promotion-option"
        :style="{backgroundImage: `url(${url})`}" :key="index" @click="selectedIndex = index; active = false">
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
  import type { GameState } from '@/protochess/types'
  import { ref } from 'vue'

  let variant: GameState | null = null
  
  const active = ref(false)
  const selectedIndex = ref(-1)
  
  const promoX = ref('0')
  const promoY = ref('0')
  const promoW = ref('0')
  const promoH = ref('0')
  const promoItemPercent = ref('0')
  const promotionUrls = ref<string[]>([])
  
  
  
  defineExpose({
    // Update the pointer to the initial state, so that we can get the dimensions and look up the piece images from the ids
    // This only needs to be called once, since the images and dimensions will not change during the game
    initState(state: GameState) {
      variant = state
    },
    // Show the promotion popup and return the index of the selected promotion
    async pickPromotion(to: [number, number], possiblePromotions: string[]): Promise<number | undefined> {
      if (!variant) {
        throw new Error('PromotionPopup: setState() must be called before pickPromotion()')
      }
      // Compute styles for the popup
      const squarePercentX = 100 / variant.boardWidth
      const squarePercentY = 100 / variant.boardHeight
      promoX.value = `${to[0] * squarePercentX}%`
      const top = Math.max(0, variant.boardHeight - to[1] - possiblePromotions.length)
      promoY.value = `${top * squarePercentY}%`
      promoW.value = `${squarePercentX}%`
      promoH.value = `${squarePercentY * possiblePromotions.length}%`
      promoItemPercent.value = `${100 / possiblePromotions.length}%`
      // For each possible promotion, find the piece type and get the image url
      promotionUrls.value = []
      for (const id of possiblePromotions) {
        const white = variant.pieceTypes.find(p => p.ids[0] === id)
        if (white) {
          promotionUrls.value.push(white.imageUrls[0] ?? '')
          continue
        }
        const black = variant.pieceTypes.find(p => p.ids[1] === id)
        if (black) {
          promotionUrls.value.push(black.imageUrls[1] ?? '')
          continue
        }
        throw new Error(`PromotionPopup: could not find piece type with id ${id}`)
      }
      selectedIndex.value = -1
      active.value = true
      
      // Wait for the user to select a promotion
      while (active.value === true) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      if (selectedIndex.value === -1) {
        return undefined
      }
      return selectedIndex.value
    },
  })
  
</script>

<style scoped lang="scss">
  .promotion-overlay {
    position: absolute;
    z-index: 20;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.1);
  }
  .promotion-picker {
    position: relative;
    top: v-bind(promoY);
    left: v-bind(promoX);
    width: v-bind(promoW);
    height: v-bind(promoH);
    background-color: rgba(255, 255, 255, 0.7);
    border-radius: 0.5rem;
    box-shadow: 0 0 0.5rem 1rem rgba(0, 0, 0, 0.4);
  }
  .promotion-option {
    width: 100%;
    height: v-bind(promoItemPercent);
    background-size: 100% 100%;
    cursor: pointer;
  }
</style>