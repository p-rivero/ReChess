<!--
  This page is used to edit the variant that is currently stored in LocalStorage (through the use of the draftVariantStore)
  
-->

<template>
  <div class="columns is-desktop reverse-columns">
    <div class="column is-narrow left-column">
      <div class="is-flex is-justify-content-center mb-4 board-container">
        <ViewableChessBoard
          ref="board"
          style="z-index: 20"
          :white-pov="true"
          :view-only="true"
          :show-coordinates="true"
          :capture-wheel-events="false"
          @clicked="coords => placePiece(coords)"
        />
      </div>
      
      <div class="is-flex is-align-items-center mb-4">
        <div class="field-label">
          <label>Board size:</label>
        </div>
        <SmartNumberInput
          class="width-5rem"
          :min="2"
          :max="16"
          :default="8"
          :start-value="draftStore.state.boardHeight"
          @changed="draftStore.setHeight"
        />
        <div class="field-label-both">
          <label>x</label>
        </div>
        <SmartNumberInput
          class="width-5rem"
          :min="2"
          :max="16"
          :default="8"
          :start-value="draftStore.state.boardWidth"
          @changed="draftStore.setWidth"
        />
      </div>
      
      <div class="is-flex is-align-items-center mb-4">
        <div class="field-label">
          <label>First player to move:</label>
        </div>
        <div class="field-body">
          <SmartDropdown
            :items="['White', 'Black']"
            :start-item="draftStore.state.playerToMove === 0 ? 'White' : 'Black'"
            @changed="item => draftStore.state.playerToMove = item === 'White' ? 0 : 1"
          />
        </div>
      </div>
      
      <div class="field mb-6">
        <label class="label">Place piece:</label>
        <PiecePlacementButtons
          ref="pieceSelector"
          :key="JSON.stringify(draftStore.state.pieceTypes)"
          :z-index="11"
          :state="draftStore.state"
          @piece-selected="id => selectedPieceId = id"
          @piece-deselected="selectedPieceId = 'none'"
        />
      </div>
      
      <SmartErrorMessage
        v-show="hasError"
        class="my-4"
        :handler="errorMsgHandler"
      />
      <div class="columns">
        <div class="column pb-1 pr-2">
          <button
            class="button is-fullwidth"
            :disabled="hasError || loading"
            @click="$router.push({name: 'analysis'})"
          >
            <div class="sz-icon icon-analysis color-theme" />
            <span>Analysis board</span>
          </button>
        </div>
        <div class="column pb-1 pl-2">
          <button
            class="button is-fullwidth"
            :disabled="hasError || loading"
            @click="playPopup?.show()"
          >
            <div class="sz-icon icon-cpu color-theme" />
            <span>Play vs. engine</span>
          </button>
        </div>
      </div>
      <div class="columns mb-5">
        <div class="column is-6 pr-2">
          <button
            class="button is-primary is-fullwidth"
            :disabled="hasError || loading"
            @click="publish"
          >
            <div class="sz-icon icon-rocket color-white" />
            <span>Publish variant</span>
          </button>
        </div>
      </div>
      <div class="columns">
        <div class="column pb-1 pr-2">
          <button
            class="button is-fullwidth"
            @click="draftStore.backupFile"
          >
            <div class="sz-icon icon-download color-theme" />
            <span>Back up</span>
          </button>
        </div>
        <div class="column pl-2">
          <button
            class="button is-fullwidth"
            @click="uploadFile"
          >
            <div class="sz-icon icon-upload color-theme" />
            <span>Upload</span>
          </button>
        </div>
      </div>
      <p>* Your draft is saved automatically, you can close this page and come back later to continue editing.</p>
    </div>
    
    
    
    <div class="column">
      <SmartTextInput
        class="is-large mb-5"
        placeholder="Variant name"
        :start-text="draftStore.state.displayName"
        :validator="(text) => {
          if (text.length === 0) return 'Please enter the name of this variant'
          if (text.length > 50) return 'Variant name must be at most 50 characters long'
          if (text.length < 3) return 'Variant name must be at least 3 characters long'
        }"
        :emit-changed-when-error="true"
        :error-handler="errorMsgHandler"
        @changed="name => draftStore.state.displayName = name"
      />
      <EditableMarkdown
        class="mb-5"
        :text="draftStore.state.description"
        :placeholder="'Describe the rules of the variant and how fun it is to play!\nYou can use **Markdown** to format your text.'"
        :editable="true"
        :error-handler="errorMsgHandler"
        :validator="text => text.length > 1000 ? 'The variant description must be at most 1000 characters long' : undefined"
        @save="text => draftStore.state.description = text"
      />
      
      <label class="label">Rules:</label>
      <div class="columns is-mobile">
        <div class="column">
          <SmartCheckbox
            text="Capturing is forced"
            class="rules-field"
            :start-value="draftStore.state.globalRules.capturingIsForced"
            @changed="value => draftStore.state.globalRules.capturingIsForced = value"
          />
          <SmartCheckbox
            text="Check is forbidden"
            class="rules-field"
            :start-value="draftStore.state.globalRules.checkIsForbidden"
            @changed="value => {
              draftStore.state.globalRules.checkIsForbidden = value
              draftStore.state.globalRules.checksToLose = 0
            }"
          />
        </div>
        
        <div class="column">
          <SmartCheckbox
            text="Stalemated player loses"
            class="rules-field"
            :start-value="draftStore.state.globalRules.stalematedPlayerLoses"
            @changed="value => draftStore.state.globalRules.stalematedPlayerLoses = value"
          />
          <SmartCheckbox
            text="Invert ALL win conditions"
            class="rules-field"
            :start-value="draftStore.state.globalRules.invertWinConditions"
            @changed="value => draftStore.state.globalRules.invertWinConditions = value"
          />
        </div>
      </div>
      <div class="is-flex is-align-items-center mb-4">
        <div class="field-label">
          <label>Repetitions for draw:</label>
        </div>
        <SmartNumberInput
          class="width-5rem"
          :min="0"
          :max="200"
          :default="3"
          :start-value="draftStore.state.globalRules.repetitionsDraw"
          @changed="value => draftStore.state.globalRules.repetitionsDraw = value"
        />
      </div>
      <div class="is-flex is-align-items-center mb-6">
        <div class="field-label">
          <label>Lose when put in check</label>
        </div>
        <SmartNumberInput
          class="width-5rem"
          :min="0"
          :max="200"
          :default="0"
          placeholder="-"
          :start-value="draftStore.state.globalRules.checksToLose"
          :disabled="draftStore.state.globalRules.checkIsForbidden"
          @changed="value => draftStore.state.globalRules.checksToLose = value"
        />
        
        <div class="field-label-right">
          <label>times</label>
        </div>
      </div>
      <label class="label">Pieces:</label>
      <PiecesSummary
        :editable="true"
        :state="draftStore.state"
        @piece-click="pieceIndex => $router.push({ name: 'edit-piece', params: { pieceIndex } })"
        @delete-click="pieceIndex => deletePiece(pieceIndex)"
        @new-click="createNewPiece"
      />
    </div>
  </div>
  
  <PopupOverlay
    v-if="selectedPieceId !== 'none'"
    :z-index="10"
    @click="pieceSelector?.cancelPlacement()"
  />
  <PlayPopup ref="playPopup" />
</template>


<script setup lang="ts">
  import ViewableChessBoard from '@/components/ChessBoard/ViewableChessBoard.vue'
  import PiecesSummary from '@/components/Variant/PiecesSummary.vue'
  import SmartCheckbox from '@/components/BasicWrappers/SmartCheckbox.vue'
  import SmartNumberInput from '@/components/BasicWrappers/SmartNumberInput.vue'
  import SmartTextInput from '@/components/BasicWrappers/SmartTextInput.vue'
  import SmartDropdown from '@/components/BasicWrappers/SmartDropdown.vue'
  import SmartErrorMessage from '@/components/BasicWrappers/SmartErrorMessage.vue'
  import EditableMarkdown from '@/components/BasicWrappers/EditableMarkdown.vue'
  import PopupOverlay from '@/components/PopupMsg/PopupOverlay.vue'
  import PlayPopup from '@/components/GameUI/PlayPopup.vue'
  import PiecePlacementButtons from '@/components/Variant/Edit/PiecePlacementButtons.vue'
  import { checkState } from '@/components/Variant/Edit/check-state'
  import { showPopup } from '@/components/PopupMsg/popup-manager'
  import { onMounted, ref, watch } from 'vue'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import { useAuthStore } from '@/stores/auth-user'
  import { placementsToFen } from '@/utils/chess/fen-to-placements'
  import { ErrorMessageHandler } from '@/utils/errors/error-message-handler'
  import { clone } from '@/utils/ts-utils'
  import { useRouter } from 'vue-router'
  import type { PublishedVariantGui } from '@/protochess/types'
  
  const draftStore = useVariantDraftStore()
  const authStore = useAuthStore()
  const router = useRouter()
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
  const playPopup = ref<InstanceType<typeof PlayPopup>>()
  
  const hasError = ref(false)
  const loading = ref(false)
  const errorMsgHandler = new ErrorMessageHandler(hasError)
  
  const pieceSelector = ref<InstanceType<typeof PiecePlacementButtons>>()
  const selectedPieceId = ref<string|'wall'|'delete'|'none'>('none')
  
  // This page is only accessible when logged in
  if (!authStore.loggedUser) {
    router.push({ name: 'home' })
  }
    
  // When state changes, update the board and run a state check
  watch(draftStore.state, () => updateBoardAndError(), { deep: true })
  onMounted(updateBoardAndError)
  function updateBoardAndError() {
    checkState(draftStore.state, errorMsgHandler)
    // Clone state and add GUI fields
    let state = clone(draftStore.state) as PublishedVariantGui
    state.fen = placementsToFen(draftStore.state)
    state.inCheck = false
    board.value?.setState(state)
  }
  
  function deletePiece(pieceIndex: number) {
    showPopup(
      'Delete piece',
      'Are you sure you want to delete this piece? This cannot be undone.',
      'yes-no',
      () => {
        const ids = draftStore.state.pieceTypes[pieceIndex].ids
        draftStore.state.pieceTypes.splice(pieceIndex, 1)
        draftStore.state.pieces = draftStore.state.pieces.filter(p => p.pieceId !== ids[0] && p.pieceId !== ids[1])
      }
    )
  }
  function createNewPiece() {
    // Limit to 26 pieces for now, since IDs are internally encoded as a single lowercase letter
    if (draftStore.state.pieceTypes.length >= 26) {
      showPopup('Cannot add new piece', 'For now, the maximum number of pieces is **26**.', 'ok')
      return
    }
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
      return
    }
    // Delete existing piece (don't need to do anything else)
    if (selectedPieceId.value === 'delete') {
      return
    }
    // Add new placement
    draftStore.state.pieces.push({
      x: coords[0],
      y: coords[1],
      pieceId: selectedPieceId.value,
    })
  }
  
  async function uploadFile() {
    const success = await draftStore.uploadFile()
    // Refresh the page if the upload was successful
    if (success) router.go(0)
    else showPopup(
      'Could not import file',
      'Make sure that the file is a `.json` with the correct format.',
      'ok'
    )
  }
  
  async function publish() {
    showPopup(
      'Are you sure you want to publish this variant?',
      'You cannot remove it or edit elements that affect gameplay. However, you are able to change its name and description.',
      'yes-no',
      async () => {
        loading.value = true
        const id = await draftStore.publish()
        loading.value = false
        if (id) router.push({ name: 'variant-details', params: { variantId: id } })
        else showPopup(
          'Could not publish variant',
          'Please try again later. If the problem persists, back up your variant and \
          [open an issue on GitHub](https://github.com/p-rivero/ReChess/issues).',
          'ok'
        )
      }
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
      min-width: 0;
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
  
  .board-container {
    // 32rem - 0.75rem (border) * 2
    height: 30.5rem;
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
