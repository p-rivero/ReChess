<template>
  <div class="is-flex is-align-items-center">
    <div class="mr-4">
      <label>Infinite slide:</label>
    </div>
    <div class="field is-grouped is-grouped-multiline">
      <div
        v-for="(selected, index) in selectedDirections"
        :key="index"
        class="control"
      >
        <button
          class="button arrow-button"
          :class="{'is-primary': selected}"
          @click="arrowClicked(index)"
        >
          <div
            :class="{
              'icon-arrow-left': index === 0,
              'icon-arrow-right': index === 1,
              'icon-arrow-up': index === 2,
              'icon-arrow-down': index === 3,
              'icon-arrow-up-left': index === 4,
              'icon-arrow-up-right': index === 5,
              'icon-arrow-down-left': index === 6,
              'icon-arrow-down-right': index === 7,
              'color-white': selected,
              'color-theme': !selected
            }"
          />
        </button>
      </div>
    </div>
  </div>
  <!-- #363636 -->
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  
  const draftStore = useVariantDraftStore()
  
  const props = defineProps<{
    pieceIndex: number
    type: 'move' | 'capture'
  }>()
  
  const selectedDirections = computed(() => {
    const ref = draftStore.state.pieceTypes[props.pieceIndex]
    // Make sure that the piece exists
    if (!ref) return []
    
    if (props.type === 'move') {
      return [
        ref.translateWest,
        ref.translateEast,
        ref.translateNorth,
        ref.translateSouth,
        ref.translateNorthwest,
        ref.translateNortheast,
        ref.translateSouthwest,
        ref.translateSoutheast,
      ]
    } else if (props.type === 'capture') {
      return [
        ref.attackWest,
        ref.attackEast,
        ref.attackNorth,
        ref.attackSouth,
        ref.attackNorthwest,
        ref.attackNortheast,
        ref.attackSouthwest,
        ref.attackSoutheast,
      ]
    } else {
      throw new Error('Invalid type')
    }
  })
  
  function arrowClicked(buttonIndex: number) {
    const ref = draftStore.state.pieceTypes[props.pieceIndex]
    if (props.type === 'move') {
      switch (buttonIndex) {
      case 0: ref.translateWest = !ref.translateWest; break
      case 1: ref.translateEast = !ref.translateEast; break
      case 2: ref.translateNorth = !ref.translateNorth; break
      case 3: ref.translateSouth = !ref.translateSouth; break
      case 4: ref.translateNorthwest = !ref.translateNorthwest; break
      case 5: ref.translateNortheast = !ref.translateNortheast; break
      case 6: ref.translateSouthwest = !ref.translateSouthwest; break
      case 7: ref.translateSoutheast = !ref.translateSoutheast; break
      default: throw new Error('Invalid button index')
      }
    } else if (props.type === 'capture') {
      switch (buttonIndex) {
      case 0: ref.attackWest = !ref.attackWest; break
      case 1: ref.attackEast = !ref.attackEast; break
      case 2: ref.attackNorth = !ref.attackNorth; break
      case 3: ref.attackSouth = !ref.attackSouth; break
      case 4: ref.attackNorthwest = !ref.attackNorthwest; break
      case 5: ref.attackNortheast = !ref.attackNortheast; break
      case 6: ref.attackSouthwest = !ref.attackSouthwest; break
      case 7: ref.attackSoutheast = !ref.attackSoutheast; break
      default: throw new Error('Invalid button index')
      }
    }
  }
  
</script>
  

<style lang="scss" scoped>
  .arrow-button {
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
  }
</style>
