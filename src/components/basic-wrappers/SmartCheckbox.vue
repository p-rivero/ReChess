<template>
  <div>
    <label class="b-checkbox checkbox">
      <input
        ref="checkboxInput"
        type="checkbox"
        value="false"
        @change="checkboxChanged($event.target)"
      >
      <span class="check" />
      <span
        v-if="text"
        class="control-label adjust-text"
      >{{ text }}</span>
    </label>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  
  const checkboxInput = ref<HTMLInputElement>()
  
  const props = defineProps<{
    text?: string
    startValue?: boolean
  }>()
  
  const emit = defineEmits<{
    (event: 'changed', value: boolean): void
  }>()
  
  defineExpose({
    setChecked(checked: boolean) {
      if (!checkboxInput.value) throw new Error('Checkbox input is null')
      checkboxInput.value.checked = checked
    },
  })
  
  onMounted(() => {
    if (!checkboxInput.value) throw new Error('Checkbox input is null')
    checkboxInput.value.checked = props.startValue
  })
  
  function checkboxChanged(checkbox: EventTarget | null) {
    if (!checkbox) throw new Error('Checkbox event target is null')
    const checked = (checkbox as HTMLInputElement).checked
    emit('changed', checked)
  }
</script>
