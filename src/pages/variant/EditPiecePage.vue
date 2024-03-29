<template>
  <div class="columns is-desktop reverse-columns">
    <div class="column is-5">
      <div class="is-flex is-justify-content-center mb-4">
        <PieceViewerWithZoom
          v-if="piece"
          ref="board"
          class="mb-5"
          style="z-index: 11;"
          :cursor-pointer="selectedDelta !== 'none'"
          :piece="piece"
          :get-click-mode="getClickMode"
          @clicked="editDelta"
        />
      </div>
      
      <SmartErrorMessage
        v-show="hasError"
        class="mb-4"
        :handler="errorMsgHandler"
      />
      
      <div class="columns mb-5">
        <div class="column is-6 pr-2">
          <RouterLink
            class="button is-primary is-fullwidth"
            :to="{name: 'edit-draft'}"
          >
            <div class="sz-icon icon-check color-white" />
            <span>Done</span>
          </RouterLink>
        </div>
      </div>
    </div>
    
    
    
    <div class="column mb-2 is-7">
      <SmartTextInput
        class="is-large mb-5"
        placeholder="Piece name"
        :start-text="piece?.displayName"
        :error-handler="errorMsgHandler"
        :error-priority="2"
        :validator="text => {
          if (text.length === 0) return 'Please enter the name of this piece'
          if (text.length > 40) return 'Piece name must be at most 40 characters long'
          if (text.length < 3) return 'Piece name must be at least 3 characters long'
        }"
        @changed="name => piece!.displayName = name"
      />
      <div class="columns">
        <div class="column is-flex is-align-items-center pb-1">
          <SmartCheckbox
            text="White"
            class="mr-1"
            tooltip="Allow the white player to use this piece.
            You will need to provide an image and a unique FEN symbol (1 letter or emoji) to identify this white piece."
            :start-value="!whiteInvisible"
            @changed="enabled => enabledCheckboxChanged(enabled, 'white')"
          />
          <PieceImageEdit
            :image-url="piece?.imageUrls[0]"
            :class="{ invisible: whiteInvisible }"
            @image-changed="url => { piece!.imageUrls[0] = url; errorMsgHandler.clear() }"
            @upload-error="imageUploadFailed"
          />
          <SmartTextInput
            ref="whiteSymbolInput"
            class="width-3rem"
            :class="{ invisible: whiteInvisible }"
            placeholder="A"
            :start-text="piece?.ids[0] ?? undefined"
            :error-handler="errorMsgHandler"
            :error-priority="1"
            :validator="t => symbolValidator(t, 'white')"
            @changed="text => updatePieceId(text, 'white')"
          />
        </div>
        
        <div class="column is-flex is-align-items-center pb-1">
          <SmartCheckbox
            text="Black"
            class="mr-1"
            tooltip="Allow the black player to use this piece.
            You will need to provide an image and a unique FEN symbol (1 letter or emoji) to identify this black piece."
            :start-value="!blackInvisible"
            @changed="enabled => enabledCheckboxChanged(enabled, 'black')"
          />
          <PieceImageEdit
            :image-url="piece?.imageUrls[1]"
            :class="{ invisible: blackInvisible }"
            @image-changed="url => { piece!.imageUrls[1] = url; errorMsgHandler.clear() }"
            @upload-error="imageUploadFailed"
          />
          <SmartTextInput
            ref="blackSymbolInput"
            class="width-3rem"
            :class="{ invisible: blackInvisible }"
            placeholder="a"
            :start-text="piece?.ids[1] ?? undefined"
            :error-handler="errorMsgHandler"
            :validator="t => symbolValidator(t, 'black')"
            @changed="text => updatePieceId(text, 'black')"
          />
        </div>
      </div>
      
      <div class="columns">
        <div class="column is-narrow is-flex is-align-items-center">
          <SmartCheckbox
            text="Custom move prefix"
            :start-value="piece?.notationPrefix[0] != null || piece?.notationPrefix[1] != null"
            @changed="enabled => {
              if (enabled) piece!.notationPrefix = [whiteNotationInput?.getText(), blackNotationInput?.getText()]
              else piece!.notationPrefix = [undefined, undefined]
            }"
          />
          <InfoTooltip
            text="This allows you to change the prefix shown in the move notation. For example, in 'Nc4' the prefix is 'N'.
            If you disable this option, the FEN symbol will be used instead (not recommended)."
          />
        </div>
        <div
          v-show="piece?.notationPrefix[0] != null"
          class="column is-flex-show is-align-items-center"
          :class="{ invisible: whiteInvisible }"
        >
          <span class="mr-2"> White: </span>
          <SmartTextInput
            ref="whiteNotationInput"
            placeholder="(no prefix)"
            :start-text="piece?.notationPrefix[0] ?? ''"
            @changed="text => piece!.notationPrefix[0] = text"
          />
        </div>
        <div
          v-show="piece?.notationPrefix[1] != null"
          class="column is-flex-show is-align-items-center"
          :class="{ invisible: blackInvisible }"
        >
          <span class="mr-2"> Black: </span>
          <SmartTextInput
            ref="blackNotationInput"
            placeholder="(no prefix)"
            :start-text="piece?.notationPrefix[1] ?? ''"
            @changed="text => piece!.notationPrefix[1] = text"
          />
        </div>
      </div>
      
      <label class="label">Behavior:</label>
      <SmartCheckbox
        text="Leader (can be checked/checkmated)"
        class="rules-field"
        :start-value="piece?.isLeader"
        @changed="value => piece!.isLeader = value"
      />
      
      <div class="columns mb-4">
        <div class="column is-flex is-align-items-center">
          <div class="field-label">
            <label>Castling</label>
          </div>
          <SmartDropdown
            :items="['No', 'As king', 'As rook']"
            :start-item="piece?.isCastleRook ? 'As rook' : piece?.castleFiles ? 'As king' : 'No'"
            @changed="item =>castlingDropdownChanged(item)"
          />
        </div>
        
        <div
          v-show="piece?.castleFiles"
          class="column is-flex-show is-align-items-center"
        >
          <div class="field-label-both">
            <label>Queenside file</label>
          </div>
          <SmartTextInput
            class="width-3rem"
            placeholder="c"
            :start-text="numberToLetter(piece?.castleFiles?.[0])"
            :error-handler="errorMsgHandler"
            :validator="text => validateCastlingFile(text, 'Queenside')"
            @changed="text => { castleFileQueenside = letterToNumber(text); piece!.castleFiles![0] = castleFileQueenside }"
          />
        </div>
        
        <div
          v-show="piece?.castleFiles"
          class="column is-flex-show is-align-items-center"
        >
          <div class="field-label-both">
            <label>Kingside file</label>
          </div>
          <SmartTextInput
            class="width-3rem"
            placeholder="g"
            :start-text="numberToLetter(piece?.castleFiles?.[1])"
            :error-handler="errorMsgHandler"
            :validator="text => validateCastlingFile(text, 'Kingside')"
            @changed="text => { castleFileKingside = letterToNumber(text); piece!.castleFiles![1] = castleFileKingside }"
          />
        </div>
      </div>
      
      <div class="is-flex">
        <label class="mr-2">Win squares:</label>
        <InfoTooltip
          text="If you manage to move this piece to a win square, you win the game instantly.
          Enter a list of squares (e.g. 'a1', 'b2', 'c3')."
        />
      </div>
      <CoordPillList
        :editable="true"
        class="mb-6"
        :starting-coords="piece?.winSquares"
        @changed="coords => piece!.winSquares = coords"
      />
      <label class="label">Movement:</label>
      <AddRemoveButtons
        text="Jumps:"
        :z-index="11"
        type="move"
        :selected-type="selectedDelta"
        @set-type="setSelectedDelta"
        @clear="clearDelta('move')"
      />
      <div class="mb-4">
        <MovementSlideRow
          :piece-index="pieceIndex"
          type="move"
        />
      </div>
      <div class="is-flex">
        <label class="mr-2">Double jump when standing on:</label>
        <InfoTooltip
          text="If the piece is standing on one of these squares, it can jump twice in a row (the second jump cannot capture a piece).
          Your opponent can capture your piece as if it had only moved once (en passant).
          Enter a list of squares (e.g. 'a1', 'b2', 'c3')."
        />
      </div>
      <CoordPillList
        :editable="true"
        class="mb-6"
        :starting-coords="piece?.doubleJumpSquares"
        @changed="coords => piece!.doubleJumpSquares = coords"
      />
        
      <label class="label">Capture:</label>
      <AddRemoveButtons
        text="Jumps:"
        :z-index="11"
        type="capture"
        :selected-type="selectedDelta"
        @set-type="setSelectedDelta"
        @clear="clearDelta('capture')"
      />
      <div class="mb-6">
        <MovementSlideRow
          :piece-index="pieceIndex"
          type="capture"
        />
      </div>
      
      <label class="label">Promotion:</label>
      <div class="is-flex">
        <label class="mr-2">Promote when landing on:</label>
        <InfoTooltip
          text="Squares where the piece will be promoted.
          Enter a list of squares (e.g. 'a1', 'b2', 'c3')."
        />
      </div>
      <CoordPillList
        class="mb-5"
        :editable="true"
        :starting-coords="piece?.promotionSquares"
        @changed="coords => piece!.promotionSquares = coords"
      />
        
      <div class="columns mb-6">
        <div
          v-if="!whiteInvisible"
          class="column"
        >
          <div class="is-flex">
            <label class="mr-2">(White) Promote to:</label>
            <InfoTooltip
              text="List of promotion options for the white player.
              Enter a list of FEN symbols (e.g. 'Q', 'R', 'B', 'N').
              If you want promotion to be optional, add the white symbol of this piece to the list."
            />
          </div>
          <CharPillList
            :editable="true"
            :starting-pills="piece?.promoVals[0]"
            @changed="promos => piece!.promoVals[0] = promos"
          />
        </div>
        
        <div
          v-if="!blackInvisible"
          class="column"
        >
          <div class="is-flex">
            <label class="mr-2">(Black) Promote to:</label>
            <InfoTooltip
              text="List of promotion options for the black player.
              Enter a list of FEN symbols (e.g. 'q', 'r', 'b', 'n').
              If you want promotion to be optional, add the black symbol of this piece to the list."
            />
          </div>
          <CharPillList
            :editable="true"
            :starting-pills="piece?.promoVals[1]"
            @changed="promos => piece!.promoVals[1] = promos"
          />
        </div>
      </div>
      
      <label class="label">Explode:</label>
      <div class="columns">
        <div class="column ">
          <SmartCheckbox
            text="Explode when capturing"
            class="rules-field"
            tooltip="The piece will explode when it captures another piece.
            You can change the shape and radius of the explosion by adding affected squares below."
            :start-value="piece?.explodeOnCapture"
            @changed="value => piece!.explodeOnCapture = value"
          />
        </div>
        <div class="column">
          <SmartCheckbox
            text="Immune to other explosions"
            class="rules-field"
            tooltip="The piece will not be affected when another piece explodes next to it.
            This does not apply to the piece's own explosion when it captures another piece."
            :start-value="piece?.immuneToExplosion"
            @changed="value => piece!.immuneToExplosion = value"
          />
        </div>
      </div>
      <AddRemoveButtons
        text="Explosion squares:"
        type="explosion"
        :class="{ 'invisible': !piece?.explodeOnCapture }"
        :z-index="11"
        :selected-type="selectedDelta"
        @set-type="setSelectedDelta"
        @clear="clearDelta('explosion')"
      />
    </div>
  </div>
  <PopupOverlay
    v-if="selectedDelta !== 'none'"
    :z-index="10"
    @click="selectedDelta = 'none'"
  />
</template>


<script setup lang="ts">
  import { ErrorMessageHandler } from '@/helpers/errors/error-message-handler'
  import { computed, ref } from 'vue'
  import { letterToNumber, numberToLetter } from '@/helpers/chess/chess-coords'
  import { paramToInt } from '@/helpers/web-utils'
  import { removePiecesById } from '@/helpers/chess/fen'
  import { returnHome } from '@/helpers/managers/navigation-manager'
  import { showPopup } from '@/helpers/managers/popup-manager'
  import { useAuthStore } from '@/stores/auth-user'
  import { useRoute } from 'vue-router'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import AddRemoveButtons from '@/components/variant/edit/AddRemoveButtons.vue'
  import CharPillList from '@/components/variant/edit/CharPillList.vue'
  import CoordPillList from '@/components/variant/edit/CoordPillList.vue'
  import InfoTooltip from '@/components/InfoTooltip.vue'
  import MovementSlideRow from '@/components/variant/edit/MovementSlideRow.vue'
  import PieceImageEdit from '@/components/variant/edit/PieceImageEdit.vue'
  import PieceViewerWithZoom from '@/components/chessboard/PieceViewerWithZoom.vue'
  import PopupOverlay from '@/components/popup-message/PopupOverlay.vue'
  import SmartCheckbox from '@/components/basic-wrappers/SmartCheckbox.vue'
  import SmartDropdown from '@/components/basic-wrappers/SmartDropdown.vue'
  import SmartErrorMessage from '@/components/basic-wrappers/SmartErrorMessage.vue'
  import SmartTextInput from '@/components/basic-wrappers/SmartTextInput.vue'
  import type { FullPieceDef, PieceId, Player } from '@/protochess/types'
  
  const route = useRoute()
  const draftStore = useVariantDraftStore()
  const authStore = useAuthStore()
  const pieceIndex = paramToInt(route.params.pieceIndex)
  let piece: FullPieceDef|null = null
  
  if (!authStore.loggedUser) {
    returnHome(401, 'You must be logged in to edit a variant.')
  }
  
  // Incorrect piece index, redirect to home page
  if (Number.isNaN(pieceIndex) || pieceIndex < 0 || pieceIndex >= draftStore.state.pieceTypes.length) {
    returnHome(400, 'This URL seems to be incorrect.')
  } else {
    piece = draftStore.state.pieceTypes[pieceIndex]
  }
  
  const board = ref<InstanceType<typeof PieceViewerWithZoom>>()
  const whiteSymbolInput = ref<InstanceType<typeof SmartTextInput>>()
  const blackSymbolInput = ref<InstanceType<typeof SmartTextInput>>()
  const whiteNotationInput = ref<InstanceType<typeof SmartTextInput>>()
  const blackNotationInput = ref<InstanceType<typeof SmartTextInput>>()
  const hasError = ref(false)
  const errorMsgHandler = new ErrorMessageHandler(hasError)
  
  // Current selected paint mode. True if adding, false if removing
  const selectedDelta = ref<'none'|'move'|'capture'|'explosion'>('none')
  
  // Hide a piece if it's current id is null or undefined
  const whiteInvisible = computed(() => piece?.ids[0] == null || piece?.ids[0] === undefined)
  const blackInvisible = computed(() => piece?.ids[1] == null || piece?.ids[1] === undefined)
  // Reference to the current (number) value of the castling file text inputs
  const castleFileQueenside = ref(piece?.castleFiles?.[0] ?? 2)
  const castleFileKingside = ref(piece?.castleFiles?.[1] ?? 6)
  
  function castlingDropdownChanged(item: string) {
    if (!piece) throw new Error('Piece is null')
    if (item === 'No') {
      piece.castleFiles = undefined
      piece.isCastleRook = false
    } else if (item === 'As king') {
      piece.castleFiles = [castleFileQueenside.value, castleFileKingside.value]
      piece.isCastleRook = false
    } else if (item === 'As rook') {
      piece.castleFiles = undefined
      piece.isCastleRook = true
    } else {
      throw new Error('Invalid castling dropdown item')
    }
    // Clear the possible error message if the castling files were incorrect
    errorMsgHandler.clear()
  }
  function validateCastlingFile(text: string, side: string): string|undefined {
    if (!piece?.castleFiles) return
    if (text.length !== 1 || text < 'a' || text > 'p')
      return `${side} castling file must be a single letter between 'a' and 'p'`
  }
  
  function enabledCheckboxChanged(enabled: boolean, color: Player) {
    if (!piece) throw new Error('Piece is null')
    // Determine the new id to use
    const textBoxVal = color === 'white' ? whiteSymbolInput.value?.getText() : blackSymbolInput.value?.getText()
    const enabledId = textBoxVal ?? ''
    const newId = enabled ? enabledId : null
    
    // Remove placements of the piece
    const i = color === 'white' ? 0 : 1
    const oldId = piece.ids[i] ?? ''
    draftStore.state.fen = removePiecesById(draftStore.state.fen, oldId)
    
    // If disabling the piece, remove the image
    if (!enabled) piece.imageUrls[i] = undefined
    
    // Set the new id
    piece.ids[i] = newId
    // Remove error message if the piece id was invalid before
    setTimeout(() => errorMsgHandler.clear())
  }
  
  function setSelectedDelta(delta: 'none'|'move'|'capture'|'explosion') {
    selectedDelta.value = delta
    // Scroll to the board
    if (delta === 'none') return
    if (!board.value) throw new Error('Board is undefined')
    board.value.$el.scrollIntoView()
  }
  
  /**
   * Determine whether this drag is an add or remove operation (based on the first square of the drag)
   * @param delta The first square of the drag
   */
  function getClickMode(delta: [number, number]): 'add'|'remove' {
    if (!piece) throw new Error('Piece is null')
    if (selectedDelta.value === 'move') {
      return piece.translateJumpDeltas.some(d => d[0] === delta[0] && d[1] === delta[1]) ? 'remove' : 'add'
    } else if (selectedDelta.value === 'capture') {
      return piece.attackJumpDeltas.some(d => d[0] === delta[0] && d[1] === delta[1]) ? 'remove' : 'add'
    } else if (selectedDelta.value === 'explosion') {
      return piece.explosionDeltas.some(d => d[0] === delta[0] && d[1] === delta[1]) ? 'remove' : 'add'
    } else {
      return 'add'
    }
  }
  /**
   * Called for each square of a drag
   * @param delta The square of the drag
   * @param mode The mode of the drag (add or remove)
   */
  function editDelta(delta: [number, number], mode?: 'add'|'remove') {
    if (!piece) throw new Error('Piece is null')
    if (!mode) throw new Error('Mode is undefined')
    if (selectedDelta.value === 'none') return
    
    // Toggle the selected delta (add or remove)
    if (selectedDelta.value === 'move') {
      piece.translateJumpDeltas = piece.translateJumpDeltas.filter(d => d[0] !== delta[0] || d[1] !== delta[1])
      if (mode === 'add') piece.translateJumpDeltas.push(delta)
    } else if (selectedDelta.value === 'capture') {
      piece.attackJumpDeltas = piece.attackJumpDeltas.filter(d => d[0] !== delta[0] || d[1] !== delta[1])
      if (mode === 'add') piece.attackJumpDeltas.push(delta)
    } else if (selectedDelta.value === 'explosion') {
      piece.explosionDeltas = piece.explosionDeltas.filter(d => d[0] !== delta[0] || d[1] !== delta[1])
      if (mode === 'add') piece.explosionDeltas.push(delta)
    } else {
      throw new Error('Invalid selectedDelta')
    }
  }
  function clearDelta(delta: 'move'|'capture'|'explosion') {
    const plural = delta === 'move' ? 'jump moves' :
      delta === 'capture' ? 'jump captures' :
      'explosion squares'
    showPopup(
      `Clear all ${plural}?`,
      `This will remove **all** the ${plural} of this piece.
      \n\n> **Tip:** If you only want to remove one square, select "Add / Remove" \
      and then *tap that square* on the board. \
      \n\nDo you want to proceed?`,
      'yes-no',
      () => {
        if (!piece) throw new Error('Piece is null')
        if (delta === 'move') piece.translateJumpDeltas = []
        else if (delta === 'capture') piece.attackJumpDeltas = []
        else if (delta === 'explosion') piece.explosionDeltas = []
        else throw new Error('Invalid delta')
      }
    )
  }
  
  function updatePieceId(newId: PieceId, color: Player) {
    if (!piece) throw new Error('Piece is null')
    // Remove all existing placements of this piece
    const oldId = color === 'white' ? piece.ids[0] : piece.ids[1]
    if (oldId) draftStore.state.fen = removePiecesById(draftStore.state.fen, oldId)
    // Update the piece id
    if (color === 'white') piece.ids[0] = newId
    else piece.ids[1] = newId
  }
  
  function imageUploadFailed() {
    showPopup(
      'Could not upload image',
      'Make sure you uploaded a valid image file and the file size is **200kB** or less. \
      \n\nFor the best visual results, I recommend using SVG files. You can use a \
      [free online SVG converter](https://www.pngtosvg.com/) to convert your image. \
      \n\n> Keep in mind that, for very complex images, the SVG file could be larger than the original.',
      'ok'
    )
  }
  
  function symbolValidator(text: string, color: Player) {
    if (whiteInvisible.value && blackInvisible.value) return 'This piece must be available to White, Black or both players'
    if (color === 'white' && whiteInvisible.value) return
    if (color === 'black' && blackInvisible.value) return
    if (text.length === 0) return 'Missing piece symbol for White player'
    const otherIndex = color === 'white' ? 1 : 0
    if (text === piece?.ids[otherIndex]) return 'The piece symbol for White and Black must be different'
    if ([...text].length !== 1) return 'The piece symbol must be a single unicode character'
    const reservedCharRegex = /[\s/0-9*]/
    if (reservedCharRegex.test(text)) {
      return 'The following characters are reserved and cannot be used as piece symbols: \
      Space, Slash (/), Asterisk (*), Numbers (0-9)'
    }
  }
</script>


<style scoped lang="scss">
  @media screen and (max-width: 1023px) {
    .reverse-columns {
      display: flex;
      flex-direction: column-reverse;
    }
    .column {
      width: 80%;
      align-self: center;
      &.is-narrow {
        width: auto;
      }
    }
  }
  @media screen and (max-width: 768px) {
    .column {
      width: 100%;
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
  
  .rules-field:not(:last-child) {
    margin-bottom: 1rem;
    flex-basis: content;
  }
  
  .width-3rem {
    width: 3rem;
  }
  
  .invisible {
    visibility: hidden;
  }
</style>
