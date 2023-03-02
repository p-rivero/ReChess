<!-- 
  This page is used to edit the variant that is currently stored in LocalStorage (through the use of the draftVariantStore)  
  
-->

<template>
  <div class="columns is-desktop reverse-columns">
    <div class="column is-narrow left-column">
      
      <div class="board-container">
        <ViewableChessBoard ref="board" :size="500" :white-pov="true" :view-only="false" :show-coordinates="true"
          :key="stateKey" @mounted="updateBoard"/>
      </div>
      
      <div class="horizontal-field">
        <div class="field-label"><label>Board size:</label></div>
        <SmartNumberInput class="width-5rem" :min="2" :max="16" :default="8"
          :start-value="draftStore.state.boardHeight"
          @changed="height => { draftStore.state.boardHeight = height; draftStore.save() }"/>
        <div class="field-label-both"><label>x</label></div>
        <SmartNumberInput class="width-5rem" :min="2" :max="16" :default="8"
          :start-value="draftStore.state.boardWidth"
          @changed="width => { draftStore.state.boardWidth = width; draftStore.save() }"/>
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
        <PiecePlacementButtons :state="draftStore.state" :key="stateKey"/>
      </div>
      
      <SmartErrorMessage v-show="hasError" class="error-message" :handler="errorMsgHandler" />
      <button class="button bottom-button" @click="$router.push({name: 'analysis'})" :disabled="hasError">
        <span class="icon">
          <div class="icon icon-analysis color-black"></div>
        </span>
        <span>Analysis board</span>
      </button>
      <button class="button bottom-button" @click="$router.push({name: 'play'})" :disabled="hasError">
        <span class="icon">
          <div class="icon icon-cpu color-black"></div>
        </span>
        <span>Play against engine</span>
      </button>
      <br>
      <button class="button is-primary bottom-button" :disabled="hasError">
        <span class="icon">
          <div class="icon icon-rocket color-white"></div>
        </span>
        <span>Publish variant</span>
      </button>
      <br>
      <br>
      <button class="button bottom-button" @click="draftStore.backupFile">
        <span class="icon">
          <div class="icon icon-download color-black"></div>
        </span>
        <span>Back up</span>
      </button>
      <button class="button bottom-button" @click="uploadFile">
        <span class="icon">
          <div class="icon icon-upload color-black"></div>
        </span>
        <span>Upload</span>
      </button>
      <br>
      <p>* Your draft is saved automatically, you can close this page and come back later to continue editing.</p>
      
    </div>
    
    
    
    <div class="column">
      <SmartTextInput :multiline="false" class="is-large" placeholder="Variant name"
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
        <div class="column is-narrow left-column">
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
      
      <!-- TODO: Invalid squares -->
      
      <label class="label" style="margin-top: 2rem;">TEMPORARY FOR DEMO:</label>
      <SmartTextInput :multiline="false" placeholder="(Temp) FEN string" class="rules-field" :key="stateKey"
        :start-text="placementsToFen(draftStore.state)"
        @changed="text => { draftStore.state.pieces = fenToPlacements(text); draftStore.save() }"/>
    </div>
  </div>
  <GameStateCheck :state="draftStore.state" :error-msg-handler="errorMsgHandler" :key="stateKey" />
</template>


<script setup lang="ts">
  import ViewableChessBoard from '@/components/ChessBoard/ViewableChessBoard.vue'
  import PiecesSummary from '@/components/EditVariant/PiecesSummary.vue'
  import SmartCheckbox from '@/components/BasicWrappers/SmartCheckbox.vue'
  import SmartNumberInput from '@/components/BasicWrappers/SmartNumberInput.vue'
  import SmartTextInput from '@/components/BasicWrappers/SmartTextInput.vue'
  import SmartDropdown from '@/components/BasicWrappers/SmartDropdown.vue'
  import SmartErrorMessage from '@/components/BasicWrappers/SmartErrorMessage.vue'
  import GameStateCheck from '@/components/GameStateCheck.vue'
  import { ref, computed } from 'vue'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import PiecePlacementButtons from '@/components/EditVariant/PiecePlacementButtons.vue'
  import { placementsToFen, fenToPlacements } from '@/utils/fen-to-placements'
  import { ErrorMessageHandler } from '@/utils/ErrorMessageHandler'
  import { useRouter } from 'vue-router'
  
  const draftStore = useVariantDraftStore()
  const router = useRouter()
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
  const stateKey = computed(() => JSON.stringify(draftStore.state))
  
  const hasError = ref(true)
  const errorMsgHandler = new ErrorMessageHandler(hasError)
  
  async function updateBoard() {
    if (board.value === undefined) {
      throw new Error('Reference to board is undefined')
    }
    // TODO: Remove this and instead put the fen and inCheck (optional) in the GameState
    let state = JSON.parse(JSON.stringify(draftStore.state))
    state.fen = placementsToFen(draftStore.state)
    await board.value.setState(state)
  }
  
  function deletePiece(pieceIndex: number) {
    // TODO: Ask for confirmation
    draftStore.state.pieceTypes.splice(pieceIndex, 1)
    draftStore.save()
  }
  function createNewPiece() {
    // Limit to 26 pieces for now, since IDs are internally encoded as a single lowercase letter
    if (draftStore.state.pieceTypes.length >= 26) return
    draftStore.state.pieceTypes.push({
      ids: ['', ''],
      isLeader: false,
      castleFiles: undefined,
      isCastleRook: false,
      explodes: false,
      explosionDeltas: [],
      immuneToExplosion: false,
      promotionSquares: [],
      promoVals: [[], []],
      doubleJumpSquares: [],
      attackSlidingDeltas: [],
      attackJumpDeltas: [],
      attackNorth: false,
      attackSouth: false,
      attackEast: false,
      attackWest: false,
      attackNortheast: false,
      attackNorthwest: false,
      attackSoutheast: false,
      attackSouthwest: false,
      translateJumpDeltas: [],
      translateSlidingDeltas: [],
      translateNorth: false,
      translateSouth: false,
      translateEast: false,
      translateWest: false,
      translateNortheast: false,
      translateNorthwest: false,
      translateSoutheast: false,
      translateSouthwest: false,
      winSquares: [],
      displayName: '',
      imageUrls: [undefined, undefined],
    })
    draftStore.save()
    router.push({ name: 'edit-piece', params: { pieceIndex: draftStore.state.pieceTypes.length - 1 } })
  }
  
  async function uploadFile() {
    const success = await draftStore.uploadFile()
    // Refresh the page if the upload was successful
    if (success) router.go(0)
    else alert('Could not import file, make sure the format is correct')
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
  
  .error-message {
    margin-top: 1rem;
    margin-bottom: 1rem;
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
