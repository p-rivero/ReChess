
<!-- 
  This page is used to edit one of the pieces of the Variant that is currently stored in LocalStorage.
  The index of the piece to edit is passed in as a parameter.
-->

<template>
  <div class="columns is-desktop reverse-columns">
    <div class="column is-narrow left-column">
      
      <div class="is-flex is-justify-content-center mb-4">
        <PieceViewerWithZoom v-if="piece" :piece="piece" style="z-index: 11;"
          @clicked="editDelta"/>
      </div>
      
      <br>
      <SmartErrorMessage v-show="hasError" class="mb-4" :handler="errorMsgHandler" />
      <button class="button is-primary bottom-button" @click="$router.push({name: 'edit-variant'})">
        <div class="sz-icon icon-check color-white"></div>
        <span>Done</span>
      </button>
    </div>
    
    
    
    <div class="column">
      <SmartTextInput :multiline="false" class="is-large" placeholder="Piece name" :start-text="piece?.displayName"
        :error-handler="errorMsgHandler"
        :error-priority="2"
        :validator="text => {
          if (text.length === 0) return 'Please enter the name of this piece'
          if (text.length > 40) return 'Piece name must be at most 40 characters long'
          if (text.length < 3) return 'Piece name must be at least 3 characters long'
        }"
        @changed="name => { piece!.displayName = name; draftStore.save() }"/>
      <br>
      <br>
      <div class="columns">
        <div class="column">
          <div class="horizontal-field">
            <SmartCheckbox text="White" class="mr-4" :start-value="!whiteInvisible"
              @changed="enabled => enabledCheckboxChanged(enabled, 'white')"/>
            <PieceImageEdit :imageUrl="piece?.imageUrls[0]" :class="{ invisible: whiteInvisible }"/>
            <SmartTextInput :multiline="false" class="width-3rem" :class="{ invisible: whiteInvisible }" placeholder="A"
              :start-text="pieceIdWhite ?? undefined"
              :error-handler="errorMsgHandler"
              :error-priority="1"
              :validator="text => {
                if (whiteInvisible && blackInvisible) return 'This piece must be available to White, Black or both players'
                if (whiteInvisible) return
                if (text.length === 0) return 'Missing piece symbol for White player'
                if (text === piece?.ids[1]) return 'The piece symbol for White and Black must be different'
                if ([...text].length !== 1) return 'The piece symbol must be a single unicode character'
              }"
              @changed="text => updatePieceId(text, 'white')"/>
          </div>
        </div>
        
        <div class="column">
          <div class="horizontal-field">
            <SmartCheckbox text="Black" class="mr-4" :start-value="!blackInvisible"
              @changed="enabled => enabledCheckboxChanged(enabled, 'black')"/>
            <PieceImageEdit :imageUrl="piece?.imageUrls[1]" :class="{ invisible: blackInvisible }"/>
            <SmartTextInput :multiline="false" class="width-3rem" :class="{ invisible: blackInvisible }" placeholder="a"
              :start-text="pieceIdBlack ?? undefined"
              :error-handler="errorMsgHandler"
              :validator="text => {
                if (blackInvisible) return
                if (text.length === 0) return 'Missing piece symbol for Black player'
                if (text === piece?.ids[0]) return 'The piece symbol for White and Black must be different'
                if ([...text].length !== 1) return 'The piece symbol must be a single unicode character'
              }"
              @changed="text => updatePieceId(text, 'black')"/>
          </div>
        </div>
      </div>
      
      <label class="label">Behavior:</label>
      <SmartCheckbox text="Leader (can be checked/checkmated)" class="rules-field"
        :startValue="piece?.isLeader"
        @changed="value => { piece!.isLeader = value; draftStore.save() }"/>
      
      <div class="horizontal-field">
        <div class="field-label">
          <label>Castling</label>
        </div>
        <SmartDropdown :items="['No', 'As king', 'As rook']"
          :startItem="piece?.isCastleRook ? 'As rook' : piece?.castleFiles ? 'As king' : 'No'"
          :onChanged="item =>castlingDropdownChanged(item)"/>
        <div v-show="piece?.castleFiles" class="is-flex-not-important is-flex-direction-row is-align-items-center">
          <div class="field-label-both">
            <label>Queenside file</label>
          </div>
          <SmartTextInput :multiline="false" class="width-3rem" placeholder="c"
            :start-text="numberToLetter(piece?.castleFiles?.[0])"
            :error-handler="errorMsgHandler"
            :validator="text => validateCastlingFile(text, 'Queenside')"
            @changed="text => { castleFileQueenside = letterToNumber(text); piece!.castleFiles![0] = castleFileQueenside; draftStore.save() }"/>
          <div class="field-label-both">
            <label>Kingside file</label>
          </div>
          <SmartTextInput :multiline="false" class="width-3rem" placeholder="g"
            :start-text="numberToLetter(piece?.castleFiles?.[1])"
            :error-handler="errorMsgHandler"
            :validator="text => validateCastlingFile(text, 'Kingside')"
            @changed="text => { castleFileKingside = letterToNumber(text); piece!.castleFiles![1] = castleFileKingside; draftStore.save() }"/>
        </div>
      </div>
      
      <label>Win instantly when standing on:</label>
      <CoordPillList :editable="true" class="mb-5" :allow-repeat="false"
        :starting-coords="piece?.winSquares"
        @changed="coords => {piece!.winSquares = coords; draftStore.save()}"/>
      
      <br>
      <label class="label">Movement:</label>
      <AddRemoveButtons text="Jumps:" :z-index="11" type="move"
        :selected-delta="selectedDelta" @update-delta="delta => selectedDelta=delta" />
      <div class="mb-4"> <MovementSlideRow :piece-index="pieceIndex" type="move"/> </div>
      <label>Double jump when standing on:</label>
      <CoordPillList :editable="true" class="mb-5" :allow-repeat="false"
        :starting-coords="piece?.doubleJumpSquares"
        @changed="coords => {piece!.doubleJumpSquares = coords; draftStore.save()}"/>
        
      <br>
      <label class="label">Capture:</label>
      <AddRemoveButtons text="Jumps:" :z-index="11" type="capture"
        :selected-delta="selectedDelta" @update-delta="delta => selectedDelta=delta" />
      <div class="mb-5"> <MovementSlideRow :piece-index="pieceIndex" type="capture"/> </div>
      
      <br>
      <label class="label">Promote:</label>
      <label>Promote when landing on:</label>
      <CoordPillList :editable="true" :allow-repeat="false"
        :starting-coords="piece?.promotionSquares"
        @changed="coords => {piece!.promotionSquares = coords; draftStore.save()}"/>
      <br>
        
      <div class="columns">
        <div v-if="!whiteInvisible" class="column">
          <label>(White) Promote to:</label>
          <CharPillList :editable="true" :allow-repeat="false"
            :starting-pills="piece?.promoVals[0]"
            @changed="promos => {piece!.promoVals[0] = promos; draftStore.save()}"/>
        </div>
        
        <div v-if="!blackInvisible" class="column">
          <label>(Black) Promote to:</label>
          <CharPillList :editable="true" :allow-repeat="false"
            :starting-pills="piece?.promoVals[1]"
            @changed="promos => {piece!.promoVals[1] = promos; draftStore.save()}"/>
        </div>
      </div>
      
      <br>
      <label class="label">Explode:</label>
      <div class="columns">
        <div class="column ">
          <SmartCheckbox text="Explode when capturing" class="rules-field"
            :startValue="piece?.explodes"
            @changed="value => { piece!.explodes = value; draftStore.save() }"/>
        </div>
        <div class="column">
          <SmartCheckbox text="Immune to other explosions" class="rules-field"
            :startValue="piece?.immuneToExplosion"
            @changed="value => { piece!.immuneToExplosion = value; draftStore.save() }"/>
        </div>
      </div>
      <AddRemoveButtons text="Explosion squares:" :z-index="11" type="explosion"
        v-show="piece?.explodes"
        :selected-delta="selectedDelta" @update-delta="delta => selectedDelta=delta" />
      
      <br>
      <label class="label">TEMPORARY FOR MVP:</label>
      <SmartTextInput :multiline="false" placeholder="(Temp) URL for white piece image" class="rules-field"
        :start-text="piece?.imageUrls[0] ?? undefined"
        @changed="text => { piece!.imageUrls[0] = text; draftStore.save() }"/>
      <SmartTextInput :multiline="false" placeholder="(Temp) URL for black piece image" class="rules-field"
        :start-text="piece?.imageUrls[1] ?? undefined"
        @changed="text => { piece!.imageUrls[1] = text; draftStore.save() }"/>
      
    </div>
  </div>
  <PopupOverlay v-if="selectedDelta[0] !== 'none'" :z-index="10" @click="selectedDelta[0] = 'none'" />
</template>


<script setup lang="ts">
  import PieceViewerWithZoom from '@/components/ChessBoard/PieceViewerWithZoom.vue'
  import MovementSlideRow from '@/components/EditVariant/MovementSlideRow.vue'
  import SmartCheckbox from '@/components/BasicWrappers/SmartCheckbox.vue'
  import SmartDropdown from '@/components/BasicWrappers/SmartDropdown.vue'
  import SmartTextInput from '@/components/BasicWrappers/SmartTextInput.vue'
  import SmartErrorMessage from '@/components/BasicWrappers/SmartErrorMessage.vue'
  import CharPillList from '@/components/EditVariant/CharPillList.vue'
  import CoordPillList from '@/components/EditVariant/CoordPillList.vue'
  import AddRemoveButtons from '@/components/EditVariant/AddRemoveButtons.vue'
  import PieceImageEdit from '@/components/EditVariant/PieceImageEdit.vue'
  import PopupOverlay from '@/components/Popup/PopupOverlay.vue'
  import type { PieceDefinition } from '@/protochess/interfaces'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import { paramToInt } from '@/utils/param-to-int'
  import { computed, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { numberToLetter, letterToNumber } from '@/utils/chess-coords'
  import { ErrorMessageHandler } from '@/utils/error-message-handler'
  
  const router = useRouter(); 
  const route = useRoute()
  const draftStore = useVariantDraftStore()
  const pieceIndex = paramToInt(route.params.pieceIndex)
  let piece: PieceDefinition|null = null
  if (Number.isNaN(pieceIndex) || pieceIndex < 0 || pieceIndex >= draftStore.state.pieceTypes.length) {
    // Incorrect piece index, redirect to edit-variant
    router.push({ name: 'edit-variant' })
  } else {
    piece = draftStore.state.pieceTypes[pieceIndex]
  }
  
  const hasError = ref(false)
  const errorMsgHandler = new ErrorMessageHandler(hasError)
  
  // Current selected paint mode. True if adding, false if removing
  const selectedDelta = ref<['none'|'move'|'capture'|'explosion', boolean]>(['none', false])
  
  // Hide a piece if it's current id is null or undefined
  const whiteInvisible = computed(() => piece?.ids[0] == null || piece?.ids[0] === undefined)
  const blackInvisible = computed(() => piece?.ids[1] == null || piece?.ids[1] === undefined)
  // Reference to the current value of the piece id text inputs, initialize to the current id
  const pieceIdWhite = ref(piece?.ids[0])
  const pieceIdBlack = ref(piece?.ids[1])
  // Reference to the current (number) value of the castling file text inputs
  const castleFileQueenside = ref(piece?.castleFiles?.[0] || 2)
  const castleFileKingside = ref(piece?.castleFiles?.[1] || 6)
  
  function castlingDropdownChanged(item: string) {
    if (item === 'No') {
      piece!.castleFiles = undefined
      piece!.isCastleRook = false
    } else if (item === 'As king') {
      piece!.castleFiles = [castleFileQueenside.value, castleFileKingside.value]
      piece!.isCastleRook = false
    } else if (item === 'As rook') {
      piece!.castleFiles = undefined
      piece!.isCastleRook = true
    } else {
      throw new Error('Invalid castling dropdown item')
    }
    // Clear the possible error message if the castling files were incorrect
    errorMsgHandler.clear()
    draftStore.save()
  }
  function validateCastlingFile(text: string, side: string): string|undefined {
    if (!piece?.castleFiles) return
    if (text.length !== 1 || text < 'a' || text > 'p')
      return `${side} castling file must be a single letter between 'a' and 'p'`
  }
  
  function enabledCheckboxChanged(enabled: boolean, color: 'white'|'black') {
    const textBoxVal = color === 'white' ? pieceIdWhite.value : pieceIdBlack.value
    const enabledId = textBoxVal ?? ''
    const id = enabled ? enabledId : null
    if (color === 'white') piece!.ids[0] = id
    else piece!.ids[1] = id
    draftStore.save()
    // Remove any error message if the piece id was invalid
    setTimeout(() => errorMsgHandler.clear())
  }
  
  function editDelta(delta: [number, number]) {
    if (!piece) return
    if (selectedDelta.value[0] === 'none') return
    const adding = selectedDelta.value[1]
    
    if (selectedDelta.value[0] === 'move') {
      piece.translateJumpDeltas = piece.translateJumpDeltas.filter(d => d[0] !== delta[0] || d[1] !== delta[1])
      if (adding) piece.translateJumpDeltas.push(delta)
    } else if (selectedDelta.value[0] === 'capture') {
      piece.attackJumpDeltas = piece.attackJumpDeltas.filter(d => d[0] !== delta[0] || d[1] !== delta[1])
      if (adding) piece.attackJumpDeltas.push(delta)
    } else if (selectedDelta.value[0] === 'explosion') {
      piece.explosionDeltas = piece.explosionDeltas.filter(d => d[0] !== delta[0] || d[1] !== delta[1])
      if (adding) piece.explosionDeltas.push(delta)
    } else {
      throw new Error('Invalid selectedDelta')
    }
    draftStore.save()
  }
  
  function updatePieceId(newId: string, color: 'white'|'black') {
    // Remove all existing placements of this piece
    const oldId = color === 'white' ? piece!.ids[0] : piece!.ids[1]
    draftStore.state.pieces = draftStore.state.pieces.filter(p => p.pieceId !== oldId)
    // Update the piece id
    if (color === 'white') {
      pieceIdWhite.value = newId;
      piece!.ids[0] = newId;
    } else {
      pieceIdBlack.value = newId;
      piece!.ids[1] = newId;
    }
    draftStore.save()
  }
</script>


<style lang="scss" scoped>
  @media screen and (max-width: 1023px) {
    .reverse-columns {
      display: flex;
      flex-direction: column-reverse;
    }
  }
  
  .left-column {
    min-width: 32rem;
  }
  
  // In mobile, allow left column to be as small as needed
  @media screen and (max-width: 1023px) {
    .left-column {
      min-width: 0;
    }
  }
    
  
  .field-label {
    flex-shrink: 0;
    flex-grow: 0;
    align-items: center;
    margin-right: 1rem;
  }
  .field-label-both {
    @extend .field-label;
    margin-left: 1rem;
  }
  
  .horizontal-field {
    display: flex;
    margin-bottom: 1rem;
    align-items: center;
  }
  
  .bottom-button {
    width: 45%;
  }
  
  .rules-field:not(:last-child) {
    margin-bottom: 1rem;
    flex-basis: content;
  }
  
  .width-3rem {
    width: 3rem;
  }
  
  .piece-image {
    width: 4rem;
    height: 4rem;
    flex-shrink: 0;
    background-color: #b58863;
    border-radius: 0.25rem;
  }
  
  .invisible {
    visibility: hidden;
  }
  
  .is-flex-not-important {
    display: flex;
  }
</style>

<style>
  cg-board {
    cursor: v-bind("selectedDelta[0] === 'none' ? 'default' : 'pointer'");
  }
</style>
