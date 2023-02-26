<!-- 
  This page is used to edit the variant that is currently stored in LocalStorage (through the use of the draftVariantStore)  
  
-->

<template>
  <div class="columns is-desktop reverse-columns">
    <div class="column is-narrow left-column">
      
      <div class="board-container">
        <ViewableChessBoard ref="board" :size="500" :white-pov="true" :view-only="false" :show-coordinates="true"/>
      </div>
      
      <div class="horizontal-field">
        <div class="field-label"><label>Board size:</label></div>
        <input class="input width-5rem" type="number" placeholder="8" min="1" max="16">
        <div class="field-label-both"><label>x</label></div>
        <input class="input width-5rem" type="number" placeholder="8" min="1" max="16">
      </div>
      
      <div class="horizontal-field">
        <div class="field-label">
          <label>First player to move:</label>
        </div>
        <div class="field-body">
          <div class="select">
            <select>
              <option>White</option>
              <option>Black</option>
            </select>
          </div>
        </div>
      </div>
      
      <div class="field">
        <label class="label">Place piece:</label>
        <PiecePlacementButtons :state="variantDraftStore.variantDraft" />
      </div>
      
      <br>
      <br>
      <button class="button bottom-button">Analysis board</button>
      <button class="button bottom-button">Play against engine</button>
      <br>
      <button class="button is-primary bottom-button">Publish</button>
      <br>
      * Your draft is saved automatically, you can close this page and come back later to continue editing.
      
    </div>
    
    
    
    <div class="column">
      <input class="input is-large" type="text" placeholder="Variant name">
      <br>
      <br>
      <textarea class="textarea" placeholder="Describe the rules of the variant and how fun it is to play!"></textarea>
      <br>
      
      <label class="label">Rules:</label>
      <div class="columns is-mobile">
        <div class="column is-narrow left-column">
          <label class="checkbox rules-field">
            <input type="checkbox">
            Capturing is forced
          </label>
          <br>
          <label class="checkbox rules-field">
            <input type="checkbox">
            Check is forbidden
          </label>
        </div>
        
        <div class="column">
          <label class="checkbox rules-field">
            <input type="checkbox">
            Stalemated player loses
          </label>
          <br>
          <label class="checkbox rules-field">
            <input type="checkbox">
            Invert ALL win conditions
          </label>
        </div>
      </div>
      <div class="horizontal-field">
        <div class="field-label">
          <label>Repetitions for draw:</label>
        </div>
        <input class="input width-5rem" type="number" placeholder="3" min="0" max="200">
      </div>
      <div class="horizontal-field">
        <div class="field-label">
          <label>Lose when put in check</label>
        </div>
        <input class="input width-5rem" type="number" placeholder="-" min="0" max="200">
        <div class="field-label-right">
          <label>times</label>
        </div>
      </div>
      <br>
      <label class="label">Pieces:</label>
      <PiecesSummary :editable="true" :state="variantDraftStore.variantDraft" />
      
    </div>
  </div>
</template>


<script setup lang="ts">
  import ViewableChessBoard from '@/components/ChessBoard/ViewableChessBoard.vue'
  import PiecesSummary from '@/components/EditVariant/PiecesSummary.vue'
  import { ref, onMounted } from 'vue'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import { getProtochess } from '@/protochess/protochess'
  import PiecePlacementButtons from '@/components/EditVariant/PiecePlacementButtons.vue'
  
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
  const variantDraftStore = useVariantDraftStore()
  
  onMounted(async () => {
    if (board.value === undefined) {
      throw new Error('Reference to board is undefined')
    }
    // TODO: Remove this and instead put the fen and inCheck (optional) in the GameState
    const protochess = await getProtochess()
    await protochess.setState(variantDraftStore.variantDraft)
    board.value.setState(await protochess.getState())
  })
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
    flex-basis: auto;
    flex-grow: 0;
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
    justify-content: left;
    margin-bottom: 1rem;
  }
  
  .bottom-button {
    width: 45%;
    margin-bottom: 0.5rem;
    margin-right: 0.5rem;
  }
  
  .rules-field:not(:last-child) {
    margin-bottom: 1rem;
  }
  
  .width-5rem {
    width: 5rem;
  }
</style>
