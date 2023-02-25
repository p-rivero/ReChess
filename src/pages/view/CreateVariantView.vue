<!-- 
  This page is used to edit the variant that is currently stored in LocalStorage (through the use of the draftVariantStore)  
  
-->

<template>
  <div class="columns is-desktop reverse-columns">
    <div class="column is-narrow left-column">
      
      <div class="board-container">
        <ViewableChessBoard ref="board" :size="500" :white-pov="true" :view-only="false" :show-coordinates="false"/>
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
        <div class="field is-grouped is-grouped-multiline">
          <div class="control">
            <button class="button">K</button>
          </div>
          <div class="control">
            <button class="button">Q</button>
          </div>
          <div class="control">
            <button class="button">R</button>
          </div>
          <div class="control">
            <button class="button">B</button>
          </div>
          <div class="control">
            <button class="button">N</button>
          </div>
          <div class="control">
            <button class="button">P</button>
          </div>
          <div class="control">
            <button class="button">k</button>
          </div>
          <div class="control">
            <button class="button">q</button>
          </div>
          <div class="control">
            <button class="button">r</button>
          </div>
          <div class="control">
            <button class="button">b</button>
          </div>
          <div class="control">
            <button class="button">n</button>
          </div>
          <div class="control">
            <button class="button">p</button>
          </div>
          <div class="control">
            <button class="button">REMOVE</button>
          </div>
        </div>
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
      todo
      <br>
      <button class="button">
        <span class="icon">
          <svg-icon type="mdi" path="mdi-plus"/>
        </span>
        <span>Add piece</span>
      </button>
      
    </div>
  </div>
</template>


<script setup lang="ts">
  import ViewableChessBoard from '@/components/ChessBoard/ViewableChessBoard.vue'
  import { getProtochess } from '@/protochess/protochess';
  import { ref, onMounted } from 'vue'
  import SvgIcon from '@jamescoyle/vue-icon'
  
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
  
  onMounted(async () => {
    if (board.value === undefined) {
      throw new Error('Reference to board is undefined')
    }
    const protochess = await getProtochess()
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
    align-items: center;
    display: flex;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
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
