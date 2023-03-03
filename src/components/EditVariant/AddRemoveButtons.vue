<template>
  <div class="horizontal-field">
    <div class="field-label mr-4">
      <label>{{ props.text }}</label>
    </div>
    <div class="field-body" :style="{ zIndex }">
      <button class="button mr-4" :class="{ 'is-primary': addSelected }" @click="addClick">
        <span class="icon">
          <div class="icon icon-add" :class="{
            'color-black': !addSelected,
            'color-white': addSelected
          }"></div>
        </span>
        <span>Add</span>
      </button>
      <button class="button" :class="{ 'is-primary': removeSelected }" @click="removeClick">
        <span class="icon">
          <div class="icon icon-trash" :class="{
            'color-black': !removeSelected,
            'color-white': removeSelected
          }"></div>
        </span>
        <span>Remove</span>
      </button>
    </div>
  </div>
</template>


<script setup lang="ts">
  import { computed } from 'vue'

  
  const props = defineProps<{
    text: string
    zIndex: number
    type: 'move'|'capture'|'explosion'
    selectedDelta: ['none'|'move'|'capture'|'explosion', boolean]
  }>()
  
  const addSelected = computed(() => props.selectedDelta[0] === props.type && props.selectedDelta[1] === true)
  const removeSelected = computed(() => props.selectedDelta[0] === props.type && props.selectedDelta[1] === false)

  const emit = defineEmits<{
    (event: 'update-delta', delta: ['none'|'move'|'capture'|'explosion', boolean]): void
  }>()
  
  
  function addClick() {
    if (props.selectedDelta[0] === props.type && props.selectedDelta[1] === true) {
      emit('update-delta', ['none', false])
    } else {
      emit('update-delta', [props.type, true])
    }
  }
  function removeClick() {
    if (props.selectedDelta[0] === props.type && props.selectedDelta[1] === false) {
      emit('update-delta', ['none', false])
    } else {
      emit('update-delta', [props.type, false])
    }
  }
</script>

<style scoped lang="scss">
  .field-label {
    flex-basis: auto;
    flex-grow: 0;
  }
</style>