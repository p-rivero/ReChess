<template>
  <div class="horizontal-field">
    <div class="field-label mr-4">
      <label>{{ props.text }}</label>
    </div>
    <div
      class="field-body"
      :style="{ zIndex }"
    >
      <button
        class="button mr-4"
        :class="{ 'is-primary': selected }"
        @click="onClick"
      >
        <div
          class="sz-icon icon-edit"
          :class="{
            'color-theme': !selected,
            'color-white': selected
          }"
        />
        <span>Add / Remove</span>
      </button>
      <button
        class="button"
        @click="emit('clear', props.type)"
      >
        <div class="sz-icon icon-trash color-theme" />
        <span>Clear</span>
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
    selectedType: 'none'|'move'|'capture'|'explosion'
  }>()
  
  const selected = computed(() => props.selectedType === props.type)

  const emit = defineEmits<{
    (event: 'set-type', type: 'none'|'move'|'capture'|'explosion'): void
    (event: 'clear', type: 'move'|'capture'|'explosion'): void
  }>()
  
  
  function onClick() {
    if (selected.value) {
      emit('set-type', 'none')
    } else {
      emit('set-type', props.type)
    }
  }
</script>

<style scoped lang="scss">
  .field-label {
    flex-basis: auto;
    flex-grow: 0;
  }
</style>