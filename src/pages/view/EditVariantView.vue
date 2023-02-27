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
        <input class="input width-5rem" type="number" placeholder="8" min="2" max="16" ref="heightInput"
          @input="inputChanged($event?.target, 8, 2, 16, 'height')">
        <div class="field-label-both"><label>x</label></div>
        <input class="input width-5rem" type="number" placeholder="8" min="2" max="16" ref="widthInput"
          @input="inputChanged($event?.target, 8, 2, 16, 'width')">
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
          <CheckboxWithCallback text="Capturing is forced" class="rules-field"
            :start-value="draftStore.state.globalRules.capturingIsForced"
            :on-changed="value => { draftStore.state.globalRules.capturingIsForced = value; draftStore.save() }"/>
          <br>
          <CheckboxWithCallback text="Check is forbidden" class="rules-field"
            :start-value="draftStore.state.globalRules.checkIsForbidden"
            :on-changed="value => { draftStore.state.globalRules.checkIsForbidden = value; draftStore.save() }"/>
        </div>
        
        <div class="column">
          <CheckboxWithCallback text="Stalemated player loses" class="rules-field"
            :start-value="draftStore.state.globalRules.stalematedPlayerLoses"
            :on-changed="value => { draftStore.state.globalRules.stalematedPlayerLoses = value; draftStore.save() }"/>
          <br>
          <CheckboxWithCallback text="Invert ALL win conditions" class="rules-field"
            :start-value="draftStore.state.globalRules.invertWinConditions"
            :on-changed="value => { draftStore.state.globalRules.invertWinConditions = value; draftStore.save() }"/>
        </div>
      </div>
      <div class="horizontal-field">
        <div class="field-label">
          <label>Repetitions for draw:</label>
        </div>
        <input class="input width-5rem" type="number" placeholder="3" min="0" max="200" ref="repetitionsForDrawInput"
          @input="inputChanged($event?.target, 3, 0, 200, 'repeatDraw')">
      </div>
      <div class="horizontal-field">
        <div class="field-label">
          <label>Lose when put in check</label>
        </div>
        <input class="input width-5rem" type="number" placeholder="-" min="0" max="200" ref="loseWhenPutInCheckTimesInput"
          @input="inputChanged($event?.target, 3, 0, 200, 'checksToLose')">
        
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
  import CheckboxWithCallback from '@/components/BasicWrappers/SmartCheckbox.vue'
  import { ref, computed, onMounted } from 'vue'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import { getProtochess } from '@/protochess/protochess'
  import PiecePlacementButtons from '@/components/EditVariant/PiecePlacementButtons.vue'
  
  const draftStore = useVariantDraftStore()
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
  const heightInput = ref<HTMLInputElement>()
  const widthInput = ref<HTMLInputElement>()
  const playerToMoveSelect = ref<HTMLSelectElement>()
  const variantNameInput = ref<HTMLInputElement>()
  const descriptionInput = ref<HTMLTextAreaElement>()
  const repetitionsForDrawInput = ref<HTMLInputElement>()
  const loseWhenPutInCheckTimesInput = ref<HTMLInputElement>()
  
  const stateKey = computed(() => JSON.stringify(draftStore.state))
  
  onMounted(() => {
    if (board.value === undefined) {
      throw new Error('Reference to board is undefined')
    }
    if (heightInput.value === undefined) {
      throw new Error('Reference to heightInput is undefined')
    }
    if (widthInput.value === undefined) {
      throw new Error('Reference to widthInput is undefined')
    }
    if (playerToMoveSelect.value === undefined) {
      throw new Error('Reference to playerToMoveSelect is undefined')
    }
    if (variantNameInput.value === undefined) {
      throw new Error('Reference to variantNameInput is undefined')
    }
    if (descriptionInput.value === undefined) {
      throw new Error('Reference to descriptionInput is undefined')
    }
    if (repetitionsForDrawInput.value === undefined) {
      throw new Error('Reference to repetitionsForDrawInput is undefined')
    }
    if (loseWhenPutInCheckTimesInput.value === undefined) {
      throw new Error('Reference to loseWhenPutInCheckTimesInput is undefined')
    }
    heightInput.value.value = draftStore.state.boardHeight.toString()
    widthInput.value.value = draftStore.state.boardWidth.toString()
    playerToMoveSelect.value.value = draftStore.state.playerToMove === 0 ? 'White' : 'Black'
    // variantNameInput.value.value = variantDraftStore.state.name
    // descriptionInput.value.value = variantDraftStore.state.description
    repetitionsForDrawInput.value.value = draftStore.state.globalRules.repetitionsDraw.toString()
    const checksToLose = draftStore.state.globalRules.checksToLose
    if (checksToLose === 0) {
      loseWhenPutInCheckTimesInput.value.value = ''
    } else {
      loseWhenPutInCheckTimesInput.value.value = checksToLose.toString()
    }
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
  
  function inputChanged(target: EventTarget|null, defaultVal: number, minVal: number, maxVal: number, field: 'height'|'width'|'repeatDraw'|'checksToLose') {
    if (target === null) throw new Error('Target is undefined')
    const text = (target as HTMLInputElement).value
    let size = parseInt(text)
    if (isNaN(size)) size = defaultVal
    if (size < minVal) size = minVal
    if (size > maxVal) size = maxVal
    if (field === 'height') {
      draftStore.state.boardHeight = size
    } else if (field === 'width') {
      draftStore.state.boardWidth = size
    } else if (field === 'repeatDraw') {
      draftStore.state.globalRules.repetitionsDraw = size
    } else if (field === 'checksToLose') {
      draftStore.state.globalRules.checksToLose = size
    }
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
