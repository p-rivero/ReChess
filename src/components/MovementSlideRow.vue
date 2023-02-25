<template>
  <div class="slide-row">
    <div style="margin-right: 1rem">
      <label>Infinite slide:</label>
    </div>
    <div class="field is-grouped is-grouped-multiline">
      <div class="control" v-for="(selected, index) in selectedDirections" :key="index">
        <button class="button arrow-button" :class="{
          'button-left': index === 0,
          'button-right': index === 1,
          'button-up': index === 2,
          'button-down': index === 3,
          'button-up-left': index === 4,
          'button-up-right': index === 5,
          'button-down-left': index === 6,
          'button-down-right': index === 7,
          'is-primary': selected
        }" @click="selectedDirections[index] = !selectedDirections[index]"></button>
      </div>
    </div>
  </div>
  <!-- #363636 -->
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  
  const selectedDirections = ref<boolean[]>([false, false, false, false, false, false, false, false])
</script>
  

<style lang="scss" scoped>
  .slide-row {
    display: flex;
    align-items: center;
  }
  .arrow-button {
    width: 2.5rem;
    height: 2.5rem;
  }
  .button-left {
    background-image: url('@/assets/img/arrow-light/left.svg')
  }
  .button-right {
    background-image: url('@/assets/img/arrow-light/right.svg')
  }
  .button-up {
    background-image: url('@/assets/img/arrow-light/up.svg')
  }
  .button-down {
    background-image: url('@/assets/img/arrow-light/down.svg')
  }
  .button-up-left {
    background-image: url('@/assets/img/arrow-light/up-left.svg')
  }
  .button-up-right {
    background-image: url('@/assets/img/arrow-light/up-right.svg')
  }
  .button-down-left {
    background-image: url('@/assets/img/arrow-light/down-left.svg')
  }
  .button-down-right {
    background-image: url('@/assets/img/arrow-light/down-right.svg')
  }
  
  .button-left.is-primary {
    background-image: url('@/assets/img/arrow-dark/left.svg')
  }
  .button-right.is-primary {
    background-image: url('@/assets/img/arrow-dark/right.svg')
  }
  .button-up.is-primary {
    background-image: url('@/assets/img/arrow-dark/up.svg')
  }
  .button-down.is-primary {
    background-image: url('@/assets/img/arrow-dark/down.svg')
  }
  .button-up-left.is-primary {
    background-image: url('@/assets/img/arrow-dark/up-left.svg')
  }
  .button-up-right.is-primary {
    background-image: url('@/assets/img/arrow-dark/up-right.svg')
  }
  .button-down-left.is-primary {
    background-image: url('@/assets/img/arrow-dark/down-left.svg')
  }
  .button-down-right.is-primary {
    background-image: url('@/assets/img/arrow-dark/down-right.svg')
  }
</style>
