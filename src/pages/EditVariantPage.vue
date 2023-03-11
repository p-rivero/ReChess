<!-- 
  This page is used to edit the variant that is currently stored in LocalStorage (through the use of the draftVariantStore)  
  
-->

<template>
  <div class="columns is-desktop reverse-columns">
    <div class="column is-narrow left-column">
      
      <div class="is-flex is-justify-content-center mb-4 board-container">
        <ViewableChessBoard ref="board" style="z-index: 20"
          :white-pov="true" :view-only="true" :show-coordinates="true" :capture-wheel-events="false"
          @clicked="coords => placePiece(coords)"/>
      </div>
      
      <div class="horizontal-field">
        <div class="field-label"><label>Board size:</label></div>
        <SmartNumberInput class="width-5rem" :min="2" :max="16" :default="8"
          :start-value="draftStore.state.boardHeight"
          @changed="draftStore.setHeight"/>
        <div class="field-label-both"><label>x</label></div>
        <SmartNumberInput class="width-5rem" :min="2" :max="16" :default="8"
          :start-value="draftStore.state.boardWidth"
          @changed="draftStore.setWidth"/>
      </div>
      
      <div class="horizontal-field">
        <div class="field-label">
          <label>First player to move:</label>
        </div>
        <div class="field-body">
          <SmartDropdown :items="['White', 'Black']"
            :start-item="draftStore.state.playerToMove === 0 ? 'White' : 'Black'"
            @changed="item => { draftStore.state.playerToMove = item === 'White' ? 0 : 1; draftStore.save() }"/>
        </div>
      </div>
      
      <div class="field">
        <label class="label">Place piece:</label>
        <PiecePlacementButtons ref="pieceSelector" :z-index="11" :state="draftStore.state"
        :key="JSON.stringify(draftStore.state.pieceTypes)"
          @piece-selected="id => selectedPieceId = id"
          @piece-deselected="selectedPieceId = 'none'"/>
      </div>
      <br>
      
      <SmartErrorMessage v-show="hasError" class="my-4" :handler="errorMsgHandler" />
      <button class="button bottom-button" @click="$router.push({name: 'analysis'})" :disabled="hasError">
        <div class="sz-icon icon-analysis color-theme"></div>
        <span>Analysis board</span>
      </button>
      <button class="button bottom-button" @click="$router.push({name: 'play'})" :disabled="hasError">
        <div class="sz-icon icon-cpu color-theme"></div>
        <span>Play vs. engine</span>
      </button>
      <br>
      <button class="button is-primary bottom-button" :disabled="hasError">
        <div class="sz-icon icon-rocket color-white"></div>
        <span>Publish variant</span>
      </button>
      <br>
      <br>
      <button class="button bottom-button" @click="draftStore.backupFile">
        <div class="sz-icon icon-download color-theme"></div>
        <span>Back up</span>
      </button>
      <button class="button bottom-button" @click="uploadFile">
        <div class="sz-icon icon-upload color-theme"></div>
        <span>Upload</span>
      </button>
      <br>
      <p>* Your draft is saved automatically, you can close this page and come back later to continue editing.</p>
      
    </div>
    
    
    
    <div class="column">
      <SmartTextInput class="is-large" placeholder="Variant name"
        :start-text="draftStore.state.variantDisplayName"
        @changed="name => { draftStore.state.variantDisplayName = name; draftStore.save() }"
        :validator="(text) => {
          if (text.length === 0) return 'Please enter the name of this variant'
          if (text.length > 50) return 'Variant name must be at most 50 characters long'
          if (text.length < 3) return 'Variant name must be at least 3 characters long'
        }"
        :error-handler="errorMsgHandler"/>
      <br>
      <br>
      <SmartTextInput :multiline="true" placeholder="Describe the rules of the variant and how fun it is to play!"
        :start-text="draftStore.state.variantDescription"
        @changed="text => { draftStore.state.variantDescription = text; draftStore.save() }"
        :validator="(text) => {if (text.length > 500) return 'Variant description must be at most 500 characters long'}"
        :error-handler="errorMsgHandler"/>
      <br>
      
      <label class="label">Rules:</label>
      <div class="columns is-mobile">
        <div class="column ">
          <SmartCheckbox text="Capturing is forced" class="rules-field"
            :start-value="draftStore.state.globalRules.capturingIsForced"
            @changed="value => { draftStore.state.globalRules.capturingIsForced = value; draftStore.save() }"/>
          <br>
          <SmartCheckbox text="Check is forbidden" class="rules-field"
            :start-value="draftStore.state.globalRules.checkIsForbidden"
            @changed="value => { draftStore.state.globalRules.checkIsForbidden = value; draftStore.save() }"/>
        </div>
        
        <div class="column">
          <SmartCheckbox text="Stalemated player loses" class="rules-field"
            :start-value="draftStore.state.globalRules.stalematedPlayerLoses"
            @changed="value => { draftStore.state.globalRules.stalematedPlayerLoses = value; draftStore.save() }"/>
          <br>
          <SmartCheckbox text="Invert ALL win conditions" class="rules-field"
            :start-value="draftStore.state.globalRules.invertWinConditions"
            @changed="value => { draftStore.state.globalRules.invertWinConditions = value; draftStore.save() }"/>
        </div>
      </div>
      <div class="horizontal-field">
        <div class="field-label">
          <label>Repetitions for draw:</label>
        </div>
        <SmartNumberInput class="width-5rem" :min="0" :max="200" :default="3"
          :start-value="draftStore.state.globalRules.repetitionsDraw"
          @changed="value => { draftStore.state.globalRules.repetitionsDraw = value; draftStore.save() }"/>
      </div>
      <div class="horizontal-field">
        <div class="field-label">
          <label>Lose when put in check</label>
        </div>
        <SmartNumberInput class="width-5rem" :min="0" :max="200" :default="0" placeholder="-"
          :start-value="draftStore.state.globalRules.checksToLose"
          @changed="value => { draftStore.state.globalRules.checksToLose = value; draftStore.save() }"/>
        
        <div class="field-label-right">
          <label>times</label>
        </div>
      </div>
      <br>
      <label class="label">Pieces:</label>
      <PiecesSummary 
        :editable="true"
        :state="draftStore.state"
        @edit-click="pieceIndex => $router.push({ name: 'edit-piece', params: { pieceIndex } })"
        @delete-click="pieceIndex => deletePiece(pieceIndex)"
        @new-click="createNewPiece" />
    </div>
  </div>
  
  <PopupOverlay v-if="selectedPieceId !== 'none'" :z-index="10" @click="pieceSelector?.cancelPlacement()" />
  <PopupMessage buttons="ok-cancel" ref="popupMessage" />
</template>


<script setup lang="ts">
  import ViewableChessBoard from '@/components/ChessBoard/ViewableChessBoard.vue'
  import PiecesSummary from '@/components/EditVariant/PiecesSummary.vue'
  import SmartCheckbox from '@/components/BasicWrappers/SmartCheckbox.vue'
  import SmartNumberInput from '@/components/BasicWrappers/SmartNumberInput.vue'
  import SmartTextInput from '@/components/BasicWrappers/SmartTextInput.vue'
  import SmartDropdown from '@/components/BasicWrappers/SmartDropdown.vue'
  import SmartErrorMessage from '@/components/BasicWrappers/SmartErrorMessage.vue'
  import PopupOverlay from '@/components/Popup/PopupOverlay.vue'
  import PopupMessage from '@/components/Popup/PopupMessage.vue'
  import PiecePlacementButtons from '@/components/EditVariant/PiecePlacementButtons.vue'
  import { checkState } from '@/components/EditVariant/check-state'
  import { onMounted, ref, watch } from 'vue'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import { placementsToFen } from '@/utils/chess/fen-to-placements'
  import { ErrorMessageHandler } from '@/utils/errors/error-message-handler'
  import { clone } from '@/utils/ts-utils'
  import { useRouter } from 'vue-router'
  import type { GameStateGui } from '@/protochess/types'
  
  const draftStore = useVariantDraftStore()
  const router = useRouter()
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
  
  const hasError = ref(true)
  const errorMsgHandler = new ErrorMessageHandler(hasError)
  
  const pieceSelector = ref<InstanceType<typeof PiecePlacementButtons>>()
  const selectedPieceId = ref<string|'wall'|'delete'|'none'>('none')
  
  const popupMessage = ref<InstanceType<typeof PopupMessage>>()
  
  // When state changes, update the board and run a state check
  watch(draftStore.state, () => updateBoardAndError(), { deep: true })
  onMounted(() => updateBoardAndError())
  function updateBoardAndError() {
    checkState(draftStore.state, errorMsgHandler)
    // Clone state and add GUI fields
    let state = clone(draftStore.state) as GameStateGui
    state.fen = placementsToFen(draftStore.state)
    state.inCheck = false
    board.value?.setState(state)
  }
  
  function deletePiece(pieceIndex: number) {
    popupMessage.value?.show(
      'Delete piece',
      'Are you sure you want to delete this piece? This cannot be undone.',
      'yes-no',
      () => {
        const ids = draftStore.state.pieceTypes[pieceIndex].ids
        draftStore.state.pieceTypes.splice(pieceIndex, 1)
        draftStore.state.pieces = draftStore.state.pieces.filter(p => p.pieceId !== ids[0] && p.pieceId !== ids[1])
        draftStore.save()
      }
    )
  }
  function createNewPiece() {
    // Limit to 26 pieces for now, since IDs are internally encoded as a single lowercase letter
    if (draftStore.state.pieceTypes.length >= 26) return
    draftStore.addPiece()
    router.push({ name: 'edit-piece', params: { pieceIndex: draftStore.state.pieceTypes.length - 1 } })
  }
  
  function placePiece(coords: [number, number]) {
    if (selectedPieceId.value === 'none') return
    // Get index of the existing placement at this coordinate, if any
    const existingIndex = draftStore.state.pieces.findIndex(piece => piece.x === coords[0] && piece.y === coords[1])
    // If the piece is already placed here, do nothing
    if (existingIndex !== -1 && draftStore.state.pieces[existingIndex].pieceId === selectedPieceId.value) return
    // Remove old placement, if any
    if (existingIndex !== -1) draftStore.state.pieces.splice(existingIndex, 1)    
    // Remove existing wall, if any
    draftStore.state.invalidSquares = draftStore.state.invalidSquares.filter(square => square[0] !== coords[0] || square[1] !== coords[1])
    // Add wall
    if (selectedPieceId.value === 'wall') {
      draftStore.state.invalidSquares.push(coords)
      draftStore.save()
      return
    }
    // Delete existing piece (don't need to do anything else)
    if (selectedPieceId.value === 'delete') {
      draftStore.save()
      return
    }
    // Add new placement
    draftStore.state.pieces.push({
      x: coords[0],
      y: coords[1],
      pieceId: selectedPieceId.value,
    })
    draftStore.save()
  }
  
  async function uploadFile() {
    const success = await draftStore.uploadFile()
    // Refresh the page if the upload was successful
    if (success) router.go(0)
    else popupMessage.value?.show(
      'Could not import file',
      'Make sure that the file is a .json with the correct format',
      'ok'
    )
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
    max-width: 32rem;
  }
  
  // In mobile, allow left column to be as small as needed
  @media screen and (max-width: 1023px) {
    .left-column {
      min-width: none;
      margin-right: 0;
    }
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
    height: 31rem;
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

<style>
  cg-board {
    cursor: v-bind("selectedPieceId === 'none' ? 'default' : 'pointer'");
  }
</style>
