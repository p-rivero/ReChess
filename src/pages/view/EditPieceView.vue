<!-- 
  This page is used to edit the variant that is currently stored in LocalStorage (through the use of the draftVariantStore)  
  
-->

<template>
  <div class="columns is-desktop reverse-columns">
    <div class="column is-narrow left-column">
      
      <div class="board-container">
        <PieceViewer ref="board" :size="500" :white-pov="true" :view-only="false" :show-coordinates="false"/>
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
      <button class="button is-primary bottom-button">Done</button>
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
      <label class="checkbox rules-field">
        <input type="checkbox">
        Leader
      </label>
      
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
          <label class="checkbox rules-field">
            <input type="checkbox">
            Explode when capturing
          </label>
        </div>
        <div class="column">
          <label class="checkbox rules-field">
            <input type="checkbox">
            Immune to other explosions
          </label>
        </div>
      </div>
      <br>
      
      <label class="label">Movement:</label>
      <div style="margin-bottom: 1rem;"> <MovementSlideRow/> </div>
      <label>Double jump when standing on:</label>
      <PillList :editable="true" :validator="() => true" :width="10" style="margin-bottom: 1.5rem;"/>
        
      <label class="label">Capture:</label>
      <div style="margin-bottom: 1.5rem;"> <MovementSlideRow/> </div>
      
      <label class="label">Promotion:</label>
      <label>Promote when landing on:</label>
      <PillList :editable="true" :validator="() => true" :width="10"/>
      <br>
        
      <div class="columns">
        <div class="column" :class="{ invisible: !whiteEnabled }">
          <label>(White) Promote to:</label>
          <PillList :editable="true" :validator="() => true" :width="10"/>
        </div>
        
        <div class="column" :class="{ invisible: !blackEnabled }">
          <label>(Black) Promote to:</label>
          <PillList :editable="true" :validator="() => true" :width="10"/>
        </div>
      </div>
      
    </div>
  </div>
</template>


<script setup lang="ts">
  import PieceViewer from '@/components/ChessBoard/PieceViewer.vue';
  import EditButton from '@/components/EditButton.vue';
  import MovementSlideRow from '@/components/EditVariant/MovementSlideRow.vue';
  import PillList from '@/components/PillList.vue'
  import { getProtochess } from '@/protochess/protochess';
  import { ref, onMounted } from 'vue'
  
  const board = ref<InstanceType<typeof PieceViewer>>()
  
  const whiteEnabled = ref(true)
  const blackEnabled = ref(true)
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
