
<!-- 
  This page is used to edit one of the pieces of the Variant that is currently stored in LocalStorage.
  The index of the piece to edit is passed in as a parameter.
-->

<template>
  <div class="columns is-desktop reverse-columns">
    <div class="column is-narrow left-column">
      
      <div class="board-container">
        <PieceViewer :size="500" :piece="piece" :key="JSON.stringify(piece)"/>
      </div>
      
      <div class="field">
        <label class="label">Add or remove:</label>
        <div class="field is-grouped is-grouped-multiline">
          <div class="control">
            <button class="button">Move jump</button>
          </div>
          <div class="control">
            <button class="button">Capture jump</button>
          </div>
          <div class="control">
            <button class="button">Explosion</button>
          </div>
        </div>
      </div>
      
      <br>
      <button class="button is-primary bottom-button" @click="$router.push({name: 'edit-variant'})">Done</button>
    </div>
    
    
    
    <div class="column">
      <SmartTextInput class="is-large" placeholder="Piece name" :start-text="piece?.displayName"
        :on-changed="name => { piece!.displayName = name; draftStore.save() }"/>
      <br>
      <br>
      <div class="columns">
        <div class="column">
          <div class="horizontal-field">
            <SmartCheckbox text="White" class="margin-right-1rem" :start-value="!whiteInvisible"
              :on-changed="enabled => enabledCheckboxChanged(enabled, 'white')"/>
            <img v-if="piece?.imageUrls[0]" class="piece-image" alt="White piece" :class="{ invisible: whiteInvisible }"
              :src="piece?.imageUrls[0] ?? ''" />
            <div v-else class="piece-image icon-cross-light" :class="{ invisible: whiteInvisible }"></div>
            <button class="icon-edit transparent-button margin-right-1rem" :class="{ invisible: whiteInvisible }" ></button>
            <SmartTextInput class="width-3rem" :class="{ invisible: whiteInvisible }" placeholder="A"
              :start-text="pieceIdWhite ?? undefined"
              :on-changed="text => { pieceIdWhite = text; piece!.ids[0] = text; draftStore.save() }"/>
          </div>
        </div>
        
        <div class="column">
          <div class="horizontal-field">
            <SmartCheckbox text="Black" class="margin-right-1rem" :start-value="!blackInvisible"
              :on-changed="enabled => enabledCheckboxChanged(enabled, 'black')"/>
            <img v-if="piece?.imageUrls[1]" class="piece-image" alt="Black piece" :class="{ invisible: blackInvisible }"
              :src="piece?.imageUrls[1] ?? ''" />
            <div v-else class="piece-image icon-cross-light" :class="{ invisible: blackInvisible }"></div>
            <button class="icon-edit transparent-button margin-right-1rem" :class="{ invisible: blackInvisible }" ></button>
            <SmartTextInput class="width-3rem" :class="{ invisible: blackInvisible }" placeholder="a"
              :start-text="pieceIdBlack ?? undefined"
              :on-changed="text => { pieceIdBlack = text; piece!.ids[1] = text; draftStore.save() }"/>
          </div>
        </div>
      </div>
      
      <label class="label">Behavior:</label>
      <SmartCheckbox text="Leader" class="rules-field"
        :startValue="piece?.isLeader"
        :onChanged="value => { piece!.isLeader = value; draftStore.save() }"/>
      
      <div class="horizontal-field">
        <div class="field-label">
          <label>Castling</label>
        </div>
        <SmartDropdown :items="['No', 'As king', 'As rook']"
          :startItem="piece?.isCastleRook ? 'As rook' : piece?.castleFiles ? 'As king' : 'No'"
          :onChanged="item =>castlingDropdownChanged(item)"/>
        <div :class="{ invisible: !(piece?.castleFiles) }" style="display: flex; flex-direction: row; align-items: center;">
          <div class="field-label-both">
            <label>Queenside file</label>
          </div>
          <SmartTextInput class="width-3rem" placeholder="c"
            :start-text="numberToLetter(piece?.castleFiles?.[0])"
            :on-changed="text => { castleFileQueenside = letterToNumber(text); piece!.castleFiles![0] = castleFileQueenside; draftStore.save() }"/>
          <div class="field-label-both">
            <label>Kingside file</label>
          </div>
          <SmartTextInput class="width-3rem" placeholder="g"
            :start-text="numberToLetter(piece?.castleFiles?.[1])"
            :on-changed="text => { castleFileKingside = letterToNumber(text); piece!.castleFiles![1] = castleFileKingside; draftStore.save() }"/>
        </div>
      </div>
      
      <div class="columns">
        <div class="column ">
          <SmartCheckbox text="Explode when capturing" class="rules-field"
            :startValue="piece?.explodes"
            :onChanged="value => { piece!.explodes = value; draftStore.save() }"/>
        </div>
        <div class="column">
          <SmartCheckbox text="Immune to other explosions" class="rules-field"
            :startValue="piece?.immuneToExplosion"
            :onChanged="value => { piece!.immuneToExplosion = value; draftStore.save() }"/>
        </div>
      </div>
      <br>
      
      <label class="label">Movement:</label>
      <div style="margin-bottom: 1rem;"> <MovementSlideRow :piece-index="pieceIndex" :type="'move'"/> </div>
      <label>Double jump when standing on:</label>
      <CoordPillList :editable="true" style="margin-bottom: 1.5rem;"
        :starting-coords="piece?.doubleJumpSquares"
        :on-changed="coords => {piece!.doubleJumpSquares = coords; draftStore.save()}"/>
        
      <label class="label">Capture:</label>
      <div style="margin-bottom: 1.5rem;"> <MovementSlideRow :piece-index="pieceIndex" :type="'capture'"/> </div>
      
      <label class="label">Promotion:</label>
      <label>Promote when landing on:</label>
      <CoordPillList :editable="true"
        :starting-coords="piece?.promotionSquares"
        :on-changed="coords => {piece!.promotionSquares = coords; draftStore.save()}"/>
      <br>
        
      <div class="columns">
        <div class="column" :class="{ invisible: whiteInvisible }">
          <label>(White) Promote to:</label>
          <CharPillList :editable="true"
            :starting-pills="piece?.promoVals[0]"
            :on-changed="promos => {piece!.promoVals[0] = promos; draftStore.save()}"/>
        </div>
        
        <div class="column" :class="{ invisible: blackInvisible }">
          <label>(Black) Promote to:</label>
          <CharPillList :editable="true"
            :starting-pills="piece?.promoVals[1]"
            :on-changed="promos => {piece!.promoVals[1] = promos; draftStore.save()}"/>
        </div>
      </div>
      
      
      <label class="label">TEMPORARY FOR DEMO:</label>
      <SmartTextInput placeholder="(Temp) URL for white piece image" class="rules-field"
        :start-text="piece?.imageUrls[0] ?? undefined"
        :on-changed="text => { piece!.imageUrls[0] = text; draftStore.save() }"/>
      <SmartTextInput placeholder="(Temp) URL for black piece image" class="rules-field"
        :start-text="piece?.imageUrls[1] ?? undefined"
        :on-changed="text => { piece!.imageUrls[1] = text; draftStore.save() }"/>
      
    </div>
  </div>
</template>


<script setup lang="ts">
  import PieceViewer from '@/components/ChessBoard/PieceViewer.vue'
  import MovementSlideRow from '@/components/EditVariant/MovementSlideRow.vue'
  import SmartCheckbox from '@/components/BasicWrappers/SmartCheckbox.vue'
  import SmartDropdown from '@/components/BasicWrappers/SmartDropdown.vue'
  import SmartTextInput from '@/components/BasicWrappers/SmartTextInput.vue'
  import CharPillList from '@/components/EditVariant/CharPillList.vue'
  import CoordPillList from '@/components/EditVariant/CoordPillList.vue'
  import type { PieceDefinition } from '@/protochess/interfaces'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import { paramToInt } from '@/utils/param-to-int'
  import { computed, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { numberToLetter, letterToNumber } from '@/utils/chess-coords'
  
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
    draftStore.save()
  }
  
  function enabledCheckboxChanged(enabled: boolean, color: 'white'|'black') {
    const textBoxVal = color === 'white' ? pieceIdWhite.value : pieceIdBlack.value
    const enabledId = textBoxVal ?? ''
    const id = enabled ? enabledId : null
    if (color === 'white') piece!.ids[0] = id
    else piece!.ids[1] = id
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
    max-width: 500px;
    margin-right: 2rem;
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
  .field-label-right {
    @extend .field-label-both;
    margin-right: 0;
  }
  
  .horizontal-field {
    display: flex;
    margin-bottom: 1rem;
    align-items: center;
  }
  
  .board-container {
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;
  }
  
  .bottom-button {
    width: 45%;
    margin-bottom: 0.5rem;
    margin-right: 0.5rem;
  }
  
  .transparent-button {
    width: 2rem;
    height: 2rem;
    background-color: transparent;
    border: none;
    background-size: contain;
  }
  
  .margin-right-1rem {
    margin-right: 1rem;
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
    background-size: contain;
    background-color: #f0d9b5;
    border-radius: 0.25rem;
  }
  
  .invisible {
    visibility: hidden;
  }
</style>
