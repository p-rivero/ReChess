<!-- 
  This page is used to edit the variant that is currently stored in LocalStorage (through the use of the draftVariantStore)  
  
-->

<template>
  <div class="columns is-desktop reverse-columns">
    <div class="column is-narrow left-column">
      
      <div class="board-container">
        <ViewableChessBoard ref="board" :size="500" :white-pov="true" :view-only="false" :show-coordinates="true"
          :key="stateKey" :after-mount="updateBoard"/>
      </div>
      
      <div class="horizontal-field">
        <div class="field-label"><label>Board size:</label></div>
        <SmartNumberInput class="width-5rem" :min="2" :max="16" :default="8"
          :start-value="draftStore.state.boardHeight"
          :on-changed="height => { draftStore.state.boardHeight = height; draftStore.save() }"/>
        <div class="field-label-both"><label>x</label></div>
        <SmartNumberInput class="width-5rem" :min="2" :max="16" :default="8"
          :start-value="draftStore.state.boardWidth"
          :on-changed="width => { draftStore.state.boardWidth = width; draftStore.save() }"/>
      </div>
      
      <div class="horizontal-field">
        <div class="field-label">
          <label>First player to move:</label>
        </div>
        <div class="field-body">
          <div class="select">
            <select ref="playerToMoveSelect" @change="playerToMoveChanged($event?.target)">
              <option>White</option>
              <option>Black</option>
            </select>
          </div>
        </div>
      </div>
      
      <div class="field">
        <label class="label">Place piece:</label>
        <PiecePlacementButtons :state="draftStore.state" :key="stateKey"/>
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
      <input class="input is-large" type="text" placeholder="Variant name" ref="variantNameInput">
      <br>
      <br>
      <textarea class="textarea" placeholder="Describe the rules of the variant and how fun it is to play!" ref="descriptionInput"></textarea>
      <br>
      
      <label class="label">Rules:</label>
      <div class="columns is-mobile">
        <div class="column is-narrow left-column">
          <SmartCheckbox text="Capturing is forced" class="rules-field"
            :start-value="draftStore.state.globalRules.capturingIsForced"
            :on-changed="value => { draftStore.state.globalRules.capturingIsForced = value; draftStore.save() }"/>
          <br>
          <SmartCheckbox text="Check is forbidden" class="rules-field"
            :start-value="draftStore.state.globalRules.checkIsForbidden"
            :on-changed="value => { draftStore.state.globalRules.checkIsForbidden = value; draftStore.save() }"/>
        </div>
        
        <div class="column">
          <SmartCheckbox text="Stalemated player loses" class="rules-field"
            :start-value="draftStore.state.globalRules.stalematedPlayerLoses"
            :on-changed="value => { draftStore.state.globalRules.stalematedPlayerLoses = value; draftStore.save() }"/>
          <br>
          <SmartCheckbox text="Invert ALL win conditions" class="rules-field"
            :start-value="draftStore.state.globalRules.invertWinConditions"
            :on-changed="value => { draftStore.state.globalRules.invertWinConditions = value; draftStore.save() }"/>
        </div>
      </div>
      <div class="horizontal-field">
        <div class="field-label">
          <label>Repetitions for draw:</label>
        </div>
        <SmartNumberInput class="width-5rem" :min="0" :max="200" :default="3"
          :start-value="draftStore.state.globalRules.repetitionsDraw"
          :on-changed="value => { draftStore.state.globalRules.repetitionsDraw = value; draftStore.save() }"/>
      </div>
      <div class="horizontal-field">
        <div class="field-label">
          <label>Lose when put in check</label>
        </div>
        <SmartNumberInput class="width-5rem" :min="0" :max="200" :default="0" placeholder="-"
          :start-value="draftStore.state.globalRules.checksToLose"
          :on-changed="value => { draftStore.state.globalRules.checksToLose = value; draftStore.save() }"/>
        
        <div class="field-label-right">
          <label>times</label>
        </div>
      </div>
      <br>
      <label class="label">Pieces:</label>
      <PiecesSummary 
        :editable="true"
        :state="draftStore.state"
        :on-edit-click="pieceIndex => $router.push({ name: 'edit-piece', params: { pieceIndex } })"
        :on-delete-click="pieceIndex => deletePiece(pieceIndex)" />
      
    </div>
  </div>
</template>


<script setup lang="ts">
  import ViewableChessBoard from '@/components/ChessBoard/ViewableChessBoard.vue'
  import PiecesSummary from '@/components/EditVariant/PiecesSummary.vue'
  import SmartCheckbox from '@/components/BasicWrappers/SmartCheckbox.vue'
  import SmartNumberInput from '@/components/BasicWrappers/SmartNumberInput.vue'
  import { ref, computed, onMounted } from 'vue'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import { getProtochess } from '@/protochess/protochess'
  import PiecePlacementButtons from '@/components/EditVariant/PiecePlacementButtons.vue'
  
  const draftStore = useVariantDraftStore()
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
  const playerToMoveSelect = ref<HTMLSelectElement>()
  
  const stateKey = computed(() => JSON.stringify(draftStore.state))
  
  onMounted(() => {
    if (playerToMoveSelect.value === undefined) {
      throw new Error('Reference to playerToMoveSelect is undefined')
    }
    playerToMoveSelect.value.value = draftStore.state.playerToMove === 0 ? 'White' : 'Black'
  })
  
  async function updateBoard() {
    if (board.value === undefined) {
      throw new Error('Reference to board is undefined')
    }
    // TODO: Remove this and instead put the fen and inCheck (optional) in the GameState
    const protochess = await getProtochess()
    await protochess.setState(draftStore.state)
    board.value.setState(await protochess.getState())
  }
  
  function deletePiece(pieceIndex: number) {
    // TODO: Ask for confirmation
    draftStore.state.pieces.splice(pieceIndex, 1)
    draftStore.save()
  }
  
  function playerToMoveChanged(target: EventTarget|null) {
    if (target === null) throw new Error('Target is undefined')
    const text = (target as HTMLSelectElement).value
    if (text === 'White') draftStore.state.playerToMove = 0
    else draftStore.state.playerToMove = 1
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
    justify-content: center;
    margin-bottom: 1rem;
    height: 500px;
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
