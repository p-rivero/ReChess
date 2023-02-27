<template>
  <div class="slide-row">
    <div style="margin-right: 1rem">
      <label>Infinite slide:</label>
    </div>
    <div class="field is-grouped is-grouped-multiline">
      <div class="control" v-for="(selected, index) in selectedDirections" :key="index">
        <button class="button arrow-button" :class="{
          'button-left': index === 0,
          'button-right': index === 1,
          'button-up': index === 2,
          'button-down': index === 3,
          'button-up-left': index === 4,
          'button-up-right': index === 5,
          'button-down-left': index === 6,
          'button-down-right': index === 7,
          'is-primary': selected
        }" @click="arrowClicked(index)"></button>
      </div>
    </div>
  </div>
  <!-- #363636 -->
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  
  const draftStore = useVariantDraftStore()
  
  const selectedDirections = computed(() => {
    const ref = draftStore.state.pieceTypes[props.pieceIndex]
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
  
  const props = defineProps<{
    pieceIndex: number
    type: 'move' | 'capture'
  }>()
  
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
    draftStore.save()
  }
  
</script>
  

<style lang="scss" scoped>
  .slide-row {
    display: flex;
    align-items: center;
  }
  .arrow-button {
    width: 2.5rem;
    height: 2.5rem;
  }
  .button-left {
    background-image: url('@/assets/img/arrow-light/left.svg')
  }
  .button-right {
    background-image: url('@/assets/img/arrow-light/right.svg')
  }
  .button-up {
    background-image: url('@/assets/img/arrow-light/up.svg')
  }
  .button-down {
    background-image: url('@/assets/img/arrow-light/down.svg')
  }
  .button-up-left {
    background-image: url('@/assets/img/arrow-light/up-left.svg')
  }
  .button-up-right {
    background-image: url('@/assets/img/arrow-light/up-right.svg')
  }
  .button-down-left {
    background-image: url('@/assets/img/arrow-light/down-left.svg')
  }
  .button-down-right {
    background-image: url('@/assets/img/arrow-light/down-right.svg')
  }
  
  .button-left.is-primary {
    background-image: url('@/assets/img/arrow-dark/left.svg')
  }
  .button-right.is-primary {
    background-image: url('@/assets/img/arrow-dark/right.svg')
  }
  .button-up.is-primary {
    background-image: url('@/assets/img/arrow-dark/up.svg')
  }
  .button-down.is-primary {
    background-image: url('@/assets/img/arrow-dark/down.svg')
  }
  .button-up-left.is-primary {
    background-image: url('@/assets/img/arrow-dark/up-left.svg')
  }
  .button-up-right.is-primary {
    background-image: url('@/assets/img/arrow-dark/up-right.svg')
  }
  .button-down-left.is-primary {
    background-image: url('@/assets/img/arrow-dark/down-left.svg')
  }
  .button-down-right.is-primary {
    background-image: url('@/assets/img/arrow-dark/down-right.svg')
  }
</style>
