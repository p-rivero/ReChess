<template>
  <BoardWithGui
    :variant="variant"
    :white="white"
    :black="black"
    :has-gauge="hasGauge"
    :invert-enemy-direction="invertEnemyDirection"
    :update-title="updateTitle"
    :show-game-over-popup="showGameOverPopup"
    
    @invalid-variant="invalidVariant"
    @piece-move="(from, to) => emit('piece-moved', from, to)"
  />
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import { useVariantStore } from '@/stores/variant'
  import type { Variant } from '@/protochess/types'
  import { showPopup } from '@/components/PopupMsg/popup-manager'
  import BoardWithGui from './BoardWithGui.vue'
  
  const route = useRoute()
  const router = useRouter()
  
  const variant = ref<Variant>()
  
  defineProps<{
    white: 'human' | 'engine'
    black: 'human' | 'engine'
    hasGauge?: boolean
    invertEnemyDirection?: boolean
    updateTitle?: boolean
    showGameOverPopup?: boolean
  }>()
  
  
  const emit = defineEmits<{
    (event: 'piece-moved', from?: [number, number], to?: [number, number]): void
  }>()
  
  onMounted(async () => {
    const fetchedVariant = await getVariant()
    if (!fetchedVariant) {
      showPopup(
        'Variant not found',
        'We couldn\'t find the variant you were looking for. You were redirected to the home page.',
        'ok'
      )
      router.push({ name: 'home' })
      return
    }
    variant.value = fetchedVariant
  })
  
  function invalidVariant() {
    showPopup(
      'Invalid variant',
      'This variant seems to be invalid, it may have been uploaded using an incompatible version \
        of the site or by a malicious user. You were redirected to the home page.',
      'ok'
    )
    router.push({ name: 'home' })
  }
  
  
  // If the variantId parameter is missing, use the stored draft variant
  async function getVariant(): Promise<Variant|undefined> {
    const variantId = route.params.variantId
    if (variantId && typeof variantId === 'string') {
      return getVariantFromServer(variantId)
    }
    const draftStore = useVariantDraftStore()
    const draft = draftStore.state
    return draft
  }
  async function getVariantFromServer(id: string): Promise<Variant|undefined> {
    const variantStore = useVariantStore()
    return variantStore.getVariant(id)
  }
</script>

