<template>
  <div
    v-show="active"
    class="promotion-overlay"
    @click="active = false"
  >
    <div class="promotion-picker">
      <div
        v-for="(url, index) of promotionUrls"
        :key="url + index"
        class="promotion-option"
        :style="{backgroundImage: `url(${url})`}"
        @click="selectedIndex = index; active = false"
      />
    </div>
  </div>
</template>


<script setup lang="ts">
  import { ref } from 'vue'
  import type { PieceId, Variant } from '@/protochess/types'

  let variant: Variant | null = null
  
  const active = ref(false)
  const selectedIndex = ref(-1)
  
  const squarePercentX = ref(0)
  const squarePercentY = ref(0)
  const promoX = ref(0)
  const promoY = ref(0)
  const numPromotions = ref(0)
  const promotionUrls = ref<string[]>([])
  
  
  
  defineExpose({
    // Update the pointer to the initial state, so that we can get the dimensions and look up the piece images from the ids
    // This only needs to be called once, since the images and dimensions will not change during the game
    initialize(initVariant: Variant) {
      variant = initVariant
    },
    // Show the promotion popup and return the index of the selected promotion
    // Set flip to true if the board is seen from black's perspective
    async pickPromotion(coord: [number, number], flip: boolean, possiblePromotions: PieceId[]): Promise<number | undefined> {
      if (!variant) {
        throw new Error('PromotionPopup: setState() must be called before pickPromotion()')
      }
      if (flip) {
        coord = [variant.boardWidth - coord[0] - 1, variant.boardHeight - coord[1] - 1]
      }
      // Compute styles for the popup
      squarePercentX.value = 100 / variant.boardWidth
      squarePercentY.value = 100 / variant.boardHeight
      promoX.value = coord[0]
      promoY.value = Math.max(0, variant.boardHeight - coord[1] - possiblePromotions.length)
      numPromotions.value = possiblePromotions.length
      // For each possible promotion, find the piece type and get the image url
      promotionUrls.value = possiblePromotions.map(id => {
        const white = variant?.pieceTypes.find(p => p.ids[0] === id)
        if (white) return white.imageUrls[0] ?? ''
        
        const black = variant?.pieceTypes.find(p => p.ids[1] === id)
        if (black) return black.imageUrls[1] ?? ''
        
        throw new Error(`PromotionPopup: could not find piece type with id ${id}`)
      })
      selectedIndex.value = -1
      active.value = true
      
      // Wait for the user to select a promotion
      while (active.value === true) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      if (selectedIndex.value === -1) {
        return
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
    top: v-bind("`${promoY * squarePercentY}%`");
    left: v-bind("`${promoX * squarePercentX}%`");
    width: v-bind("`${squarePercentX}%`");
    height: v-bind("`${numPromotions * squarePercentY}%`");
    background-color: rgba(255, 255, 255, 0.7);
    border-radius: 0.5rem;
    box-shadow: 0 0 0.5rem 1rem rgba(0, 0, 0, 0.4);
  }
  .promotion-option {
    width: 100%;
    height: v-bind("`${100 / numPromotions}%`");
    background-size: 100% 100%;
    cursor: pointer;
    
    transition: transform 0.15s;
    &:hover {
      transform: scale(1.15);
    }
  }
</style>
