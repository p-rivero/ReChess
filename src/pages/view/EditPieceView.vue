<!-- 
  This page is used to edit the variant that is currently stored in LocalStorage (through the use of the draftVariantStore)  
  
-->

<template>
  <div class="columns is-desktop reverse-columns">
    <div class="column is-narrow left-column">
      
      <div class="board-container">
        <PieceViewer :size="500" :piece="piece"/>
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
      <button class="button is-primary bottom-button" @click="$router.push('/edit')">Done</button>
    </div>
    
    
    
    <div class="column">
      <input class="input is-large" type="text" placeholder="Piece name">
      <br>
      <br>
      <div class="columns">
        <div class="column">
          <div class="horizontal-field">
            <label class="checkbox piece-color-checkbox" style="margin-right: 1rem">
              <input type="checkbox" v-model="whiteEnabled">
              White
            </label>
            <div class="piece-image" :class="{ invisible: !whiteEnabled }"></div>
            <EditButton :class="{ invisible: !whiteEnabled }" />
            <input class="input width-3rem" :class="{ invisible: !whiteEnabled }" type="text" placeholder="A">
          </div>
        </div>
        
        <div class="column">
          <div class="horizontal-field">
            <label class="checkbox" style="margin-right: 1rem">
              <input type="checkbox" v-model="blackEnabled">
              Black
            </label>
            <div class="piece-image" :class="{ invisible: !blackEnabled }"></div>
            <EditButton :class="{ invisible: !blackEnabled }" />
            <input class="input width-3rem" :class="{ invisible: !blackEnabled }" type="text" placeholder="a">
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
        <div class="select">
          <select>
            <option>No</option>
            <option>As king</option>
            <option>As rook</option>
          </select>
        </div>
        <div class="field-label-both">
          <label>Queenside file</label>
        </div>
        <input class="input width-3rem" type="text" placeholder="c">
        <div class="field-label-both">
          <label>Kingside file</label>
        </div>
        <input class="input width-3rem" type="text" placeholder="g">
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
        <div class="column" :class="{ invisible: !whiteEnabled }">
          <label>(White) Promote to:</label>
          <CharPillList :editable="true"
            :starting-pills="piece?.promoVals[0]"
            :on-changed="promos => {piece!.promoVals[0] = promos; draftStore.save()}"/>
        </div>
        
        <div class="column" :class="{ invisible: !blackEnabled }">
          <label>(Black) Promote to:</label>
          <CharPillList :editable="true"
            :starting-pills="piece?.promoVals[1]"
            :on-changed="promos => {piece!.promoVals[1] = promos; draftStore.save()}"/>
        </div>
      </div>
      
    </div>
  </div>
</template>


<script setup lang="ts">
  import PieceViewer from '@/components/ChessBoard/PieceViewer.vue'
  import EditButton from '@/components/EditButton.vue'
  import MovementSlideRow from '@/components/EditVariant/MovementSlideRow.vue'
  import SmartCheckbox from '@/components/BasicWrappers/SmartCheckbox.vue'
  import CharPillList from '@/components/EditVariant/CharPillList.vue'
  import CoordPillList from '@/components/EditVariant/CoordPillList.vue'
  import type { PieceDefinition } from '@/protochess/interfaces'
  import { router } from '@/router'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import { paramToInt } from '@/utils/param-to-int'
  import { ref } from 'vue'
  import { useRoute } from 'vue-router'
  
  const whiteEnabled = ref(true)
  const blackEnabled = ref(true)
  
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
    background-image: url("@/assets/img/pieces/knook.svg");
    background-size: contain;
  }
  
  .invisible {
    visibility: hidden;
  }
</style>
