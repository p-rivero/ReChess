<template>
  <div>
    <div class="field is-grouped is-grouped-multiline">
      <button
        v-for="piece in pieceList"
        :key="'' + piece.id + piece.definition.imageUrls"
        class="control button sz-3 px-1 py-1"
        :class="{'is-primary': selectedId === piece.id}"
        :style="{zIndex}"
        @click="onPieceClick(piece)"
      >
        <PieceImageView
          :piece="piece.definition"
          :color="piece.color"
        />
      </button>
      
      <div class="control">
        <button
          class="button sz-3 px-2 py-2"
          :class="{'is-primary': selectedId === 'wall'}"
          :style="{zIndex}"
          @click="onPieceClick('wall')"
        >
          <div
            class="icon-wall"
            :class="{
              'color-theme': selectedId !== 'wall',
              'color-white': selectedId === 'wall',
            }"
          />
        </button>
      </div>
      
      <div class="control">
        <button
          class="button sz-3 px-2 py-2"
          :class="{'is-primary': selectedId === 'delete'}"
          :style="{zIndex}"
          @click="onPieceClick('delete')"
        >
          <div
            class="icon-trash"
            :class="{
              'color-theme': selectedId !== 'delete',
              'color-white': selectedId === 'delete',
            }"
          />
        </button>
      </div>
    </div>
    <button
      class="button"
      @click="emit('clear-all-click')"
    >
      <span class="sz-icon icon-trash color-theme" />
      Clear board
    </button>
  </div>
</template>

<script setup lang="ts">
  import { ref , watch } from 'vue'
  import { showPopup } from '@/helpers/managers/popup-manager'
  import PieceImageView from '@/components/variant/PieceImageView.vue'
  import type { FullPieceDef, Player, Variant } from '@/protochess/types'
  
  const selectedId = ref<string|'wall'|'delete'|'none'>('none')
    
  const props = defineProps<{
    variant: Variant
    zIndex: number
  }>()
  
  const emit = defineEmits<{
    (event: 'piece-selected', piece: string | 'wall' | 'delete'): void
    (event: 'piece-deselected'): void
    (event: 'delete-click'): void
    (event: 'clear-all-click'): void
  }>()
  
  defineExpose({
    cancelPlacement() {
      selectedId.value = 'none'
      emit('piece-deselected')
    },
  })
  
  type Piece = {
    id: string | null | undefined
    definition: FullPieceDef
    color: Player
  }
  
  // Extract the id and url from the piece definition
  const pieceList = ref<Piece[]>([])
  watch(props, p => {
    pieceList.value = []
    // First all white pieces
    for (const piece of p.variant.pieceTypes) {
      if (piece.ids[0] || piece.imageUrls[0]) {
        pieceList.value.push({
          id: piece.ids[0],
          definition: piece,
          color: 'white',
        })
      }
    }
    // Then all black pieces
    for (const piece of p.variant.pieceTypes) {
      if (piece.ids[1] || piece.imageUrls[1]) {
        pieceList.value.push({
          id: piece.ids[1],
          definition: piece,
          color: 'black',
        })
      }
    }
  }, { immediate: true })
  
  function onPieceClick(piece: Piece | 'wall' | 'delete') {
    let id: string
    
    if (typeof piece === 'string') {
      // Wall or delete
      id = piece
    } else {
      // Piece
      const pieceName = piece.definition.displayName ? `**${piece.definition.displayName}**` : 'this piece'
      const image = piece.definition.imageUrls[piece.color === 'white' ? 0 : 1]
      if (!piece.id) {
        showPopup(
          'Invalid piece',
          `You cannot place ${pieceName} on the board because it is missing a *symbol* that identifies it 
          (usually an *uppercase letter* for White and a *lowercase letter* for Black).\n\nPlease edit ${pieceName}
          and add a symbol for **${piece.color}**.`,
          'ok'
        )
        return
      }
      if (!image) {
        showPopup(
          'Invalid piece',
          `You cannot place ${pieceName} (${piece.id}) on the board because it is missing an *image*.
          \n\nPlease edit ${pieceName} and add an image for **${piece.color}**.`,
          'ok'
        )
        return
      }
      id = piece.id
    }
    
    // No error, select the piece
    if (selectedId.value === id) {
      selectedId.value = 'none'
      emit('piece-deselected')
    } else {
      selectedId.value = id
      emit('piece-selected', id)
    }
  }
    
</script>
