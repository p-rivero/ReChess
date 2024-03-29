<!--
  This component is a list of pill-shaped text items, which can be edited or removed.
  
  Properties:
  - editable: True if the pills can be edited and removed, and if the user can add new pills.
  - validator: A function that validates the text of a pill. The function returns true if the text is valid.
  - startingPills: An array of strings to start with.
-->

<template>
  <div class="is-flex is-flex-wrap-wrap">
    <div
      v-for="(pill, pillIndex) of pills"
      :key="pillIndex"
      class="pill tag mx-1 my-1"
      :class="{
        'is-primary': !pill.error,
        'is-danger': pill.error,
        'non-editable': !editable,
      }"
      :data-tooltip="getTextWidth(pill.text) > remToPx(11) ? pill.text : undefined"
      @click="onPillClick(pill)"
    >
      <span class="pl-2 pr-1 adjust-text is-size-4"> {{ prefix }} </span>
      <div
        v-if="!pill.editing"
        class="pill-text pr-1 adjust-text"
      >
        {{ pill.text }}
      </div>
      <input
        v-else
        ref="pillInput"
        v-autowidth
        class="pill-input px-0 py-0"
        type="text"
        :value="pill.text"
        :maxlength="maxPillLength"
        @input="onPillInput(pill, $event)"
        @blur="finishEdit(pill)"
        @keydown.enter="finishEdit(pill)"
        @keydown.esc="cancelEdit(pill)"
      >
      <button
        v-if="editable"
        aria-label="remove"
        class="delete mr-2"
        @click="removePill(pill)"
      />
    </div>
    <div
      v-if="editable && (!maxPills || pills.length < maxPills)"
      class="pill tag mx-1 my-1 is-primary"
      @click="onAddPillClick()"
    >
      <div class="add-button sz-2">
        +
      </div>
    </div>
  </div>
</template>


<script lang="ts">
// Internal type for representing a pill
  interface Pill {
    text: string
    editing: boolean
    error: boolean
    originalText: string
  }

  function stringsToPills(list: string[]): Pill[] {
    return list.map((text) => {
      return {
        text: text,
        editing: false,
        error: false,
        originalText: text,
      }
    })
  }
</script>


<script setup lang="ts">
  import { getTextWidth , remToPx } from '@/helpers/web-utils'
  import { ref } from 'vue'


  const props = defineProps<{
    editable: boolean
    validator?: (text: string) => boolean
    startingPills?: string[]
    allowRepeat?: boolean
    prefix?: string
    maxPills?: number
    maxPillLength?: number
  }>()

  const emit = defineEmits<{
    (event: 'changed', pills: string[]): void
  }>()


  const pills = ref<Pill[]>(stringsToPills(props.startingPills ?? []))
  const pillInput = ref<HTMLInputElement[]>()

  function onPillClick(pill: Pill) {
    if (!props.editable) return
    if (pill.editing) return
    // Signal that the pill is being edited
    pill.editing = true
    focusPillInput()
  }

  function onPillInput(pill: Pill, event: Event) {
    const input = event.target as HTMLInputElement
    pill.text = input.value
    pill.error = false
  }

  function finishEdit(pill: Pill) {
    // If the pill is empty, don't call the validator and remove it
    if (pill.text === '') {
      removePill(pill)
      callbackOnChanged()
      return
    }
    const repeatError = !props.allowRepeat && pills.value.some((p) => p.text === pill.text && p !== pill)
    if (!repeatError && (props.validator?.(pill.text) ?? true)) {
      pill.originalText = pill.text
      pill.error = false
      pill.editing = false
      callbackOnChanged()
    } else if (!pill.error) {
      // First attempt: show error, re-focus input
      pill.error = true
      focusPillInput()
    } else {
      // Second attempt: revert to original text, stop editing
      pill.text = pill.originalText
      pill.error = false
      pill.editing = false
      // Pill was just created and the user entered invalid text
      if (pill.originalText === '') removePill(pill)
    }
  }

  function cancelEdit(pill: Pill) {
    pill.text = pill.originalText
    pill.error = false
    pill.editing = false
  }

  function removePill(pill: Pill) {
    const index = pills.value.indexOf(pill)
    // Pill may already have been removed (e.g. pressing enter can also trigger blur)
    if (index === -1) return
    pills.value.splice(index, 1)
    callbackOnChanged()
  }

  function onAddPillClick() {
    const pill: Pill = {
      text: '',
      editing: true,
      error: false,
      originalText: '',
    }
    pills.value.push(pill)
    focusPillInput()
  }

  function focusPillInput() {
    // Wait for the DOM to update, then focus the input
    setTimeout(() => {
      // Pill may have been removed by clicking the delete button
      if (pillInput.value === undefined) return
      if (pillInput.value.length === 0) return
      pillInput.value[pillInput.value.length-1].focus()
    })
  }

  function callbackOnChanged() {
    emit('changed', pills.value.map((pill) => pill.text))
  }

</script>


<style scoped lang="scss">
  .pill {
    height: 2rem;
    padding: 0;
    border-radius: 1rem;
    cursor: pointer;
    .pill-text {
      font-size: 1rem;
      pointer-events: none;
      max-width: 12rem;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .pill-input {
      font-size: 1rem;
      color: white;
      background-color: transparent;
      border: none;
      max-width: 12rem;
      outline: none;
      margin-right: 0.1rem;
    }
    .add-button {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      // Hover effect
      border-radius: 50%;
      &:hover {
        background-color: rgba(0, 0, 0, 0.2);
      }
    }
  }
  .non-editable {
    padding-right: 0.5rem;
    cursor: default;
  }
</style>
