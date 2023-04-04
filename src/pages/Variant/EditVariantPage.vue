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
          :view-only="selectedPieceId !== 'none'"
          :show-coordinates="true"
          :capture-wheel-events="false"
          :get-click-mode="getClickMode"
          :free-mode="true"
          @clicked="togglePiece"
          @user-moved="movePiece"
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
        <label class="label">Place or remove pieces:</label>
        <PiecePlacementButtons
          ref="pieceSelector"
          :key="JSON.stringify(draftStore.state.pieceTypes)"
          :z-index="11"
          :variant="draftStore.state"
          @piece-selected="id => { board?.$el.scrollIntoView(); selectedPieceId = id }"
          @piece-deselected="selectedPieceId = 'none'"
          @delete-click="clearBoard"
          @clear-all-click="clearBoard"
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
            style="position: relative;"
            class="button is-fullwidth"
            @click="importFile('application/json').then(loadFile)"
          >
            <FileDropArea @file-dropped="loadFile" />
            <div class="sz-icon icon-upload color-theme" />
            <span>Upload</span>
          </button>
        </div>
      </div>
      <p>* Your draft is saved automatically, you can close this page and come back later to continue editing.</p>
    </div>
    
    
    
    <div class="column mb-5">
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
        @reorder="movePieceType"
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
  import FileDropArea from '@/components/FileDropArea.vue'
  import { checkState } from '@/components/Variant/Edit/check-state'
  import { showPopup } from '@/components/PopupMsg/popup-manager'
  import { onMounted, ref, watch } from 'vue'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import { useAuthStore } from '@/stores/auth-user'
  import { ErrorMessageHandler } from '@/utils/errors/error-message-handler'
  import { useRouter } from 'vue-router'
  import { importFile } from '@/utils/file-io'
  import { fenToPlacements, getPieceAt, placementsToFen, removePiecesByIds } from '@/utils/chess/fen'
  
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
    
  // When state changes, check if the state is valid, and update the board
  watch(draftStore.state, () => updateBoardAndError(), { deep: true })
  onMounted(updateBoardAndError)
  async function updateBoardAndError() {
    // Update error message
    await checkState(draftStore.state, errorMsgHandler)
    board.value?.setState(draftStore.state)
  }
  
  function deletePiece(pieceIndex: number) {
    showPopup(
      'Delete piece',
      'Are you sure you want to delete this piece? This cannot be undone.',
      'yes-no',
      () => {
        const ids = draftStore.state.pieceTypes[pieceIndex].ids
        draftStore.state.pieceTypes.splice(pieceIndex, 1)
        let fen = draftStore.state.fen
        fen = removePiecesByIds(fen, [ids[0] ?? '', ids[1] ?? ''])
        draftStore.state.fen = fen
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
  
  /**
   * Determine whether this drag is an add or remove operation (based on the first square of the drag)
   * @param coords The coordinates of the first square of the drag
   */
  function getClickMode(coords: [number, number]): 'add'|'remove' {
    // If selectedPieceId === 'delete', the click mode doesn't matter
    if (selectedPieceId.value === 'wall') {
      return getPieceAt(draftStore.state.fen, coords) === '*' ? 'remove' : 'add'
    } else {
      return getPieceAt(draftStore.state.fen, coords) === selectedPieceId.value ? 'remove' : 'add'
    }
  }
  
  /**
   * Called for each square of a drag
   * @param coords The coordinates of the selected square
   * @param mode The mode of the drag (add or remove)
   */
  function togglePiece(coords: [number, number], mode?: 'add'|'remove') {
    if (!mode) throw new Error('Mode must be specified')
    // No piece selected, don't interact with board
    if (selectedPieceId.value === 'none') return
    let placements = fenToPlacements(draftStore.state.fen)

    const placementIndex = placements.findIndex(piece => piece.x === coords[0] && piece.y === coords[1])
    const pieceId = placementIndex !== -1 ? placements[placementIndex].pieceId : null
    const hasWall = pieceId === '*'
    
    if (selectedPieceId.value === 'delete') {
      // Delete button selected: override click mode and remove all pieces and walls at this square
      placements = placements.filter(piece => piece.x !== coords[0] || piece.y !== coords[1])
      draftStore.state.fen = placementsToFen(placements)
      return
    }
    
    const selectedId = selectedPieceId.value === 'wall' ? '*' : selectedPieceId.value
    if (mode === 'remove') {
      // Remove mode: only remove the selected piece (or walls)
      if (pieceId === selectedId) {
        placements.splice(placementIndex, 1)
      }
    } else {
      // Add mode: add the selected piece (or walls) only if there's no wall there
      if (hasWall) return
      if (pieceId) placements.splice(placementIndex, 1)
      placements.push({
        x: coords[0],
        y: coords[1],
        pieceId: selectedId,
      })
    }
    draftStore.state.fen = placementsToFen(placements)
  }
  
  function movePiece(from: [number, number], to: [number, number]) {
    let placements = fenToPlacements(draftStore.state.fen)
    // If there's a wall at the destination, don't move the piece
    if (placements.some(p => p.x === to[0] && p.y === to[1] && p.pieceId === '*')) {
      updateBoardAndError()
      return
    }
    // If there's a piece at the destination, remove it
    placements = placements.filter(p => p.x !== to[0] || p.y !== to[1])
    // Move the piece
    const pieceIndex = placements.findIndex(p => p.x === from[0] && p.y === from[1])
    if (pieceIndex === -1) {
      throw new Error('Could not find piece to move')
    }
    placements[pieceIndex].x = to[0]
    placements[pieceIndex].y = to[1]
  }
  
  function clearBoard() {
    showPopup(
      'Clear board',
      'This will remove **all** pieces and walls from the board. Do you want to continue?',
      'yes-no',
      () => { draftStore.state.fen = '' }
    )
  }
  
  async function loadFile(file: Blob) {
    const success = await draftStore.loadFile(file)
    // Refresh the page if the upload was successful
    if (success) router.go(0)
    else showPopup(
      'Could not import file',
      'Make sure that the file is a `.json` with the correct format.',
      'ok'
    )
  }
  
  async function publish() {
    let nameExists: boolean
    try {
      nameExists = await draftStore.nameExists()
    } catch {
      showPopup(
        'Could not publish variant',
        'It seems that it\'s not possible to connect to the server. Please try again later. \
        If the problem persists, back up your variant and \
        [open an issue on GitHub](https://github.com/p-rivero/ReChess/issues).',
        'ok'
      )
      return
    }
    const nameExistsWarning = !nameExists ? '' :
      '\n\n>**WARNING:** A variant with this name already exists. If you proceed, it could be \
      harder to find your variant. Consider changing the name.'
    showPopup(
      'Are you sure you want to publish this variant?',
      'You cannot remove it or edit elements that affect gameplay. However, you are able to change \
      its name and description.' + nameExistsWarning,
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
  
  function movePieceType(oldIndex: number, newIndex: number) {
    const piece = draftStore.state.pieceTypes.splice(oldIndex, 1)[0]
    draftStore.state.pieceTypes.splice(newIndex, 0, piece)
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
