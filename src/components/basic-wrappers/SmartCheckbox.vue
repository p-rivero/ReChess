<template>
  <div class="container is-align-items-center">
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
    <InfoTooltip
      v-if="tooltip"
      class="tooltip-icon"
      :text="tooltip"
    />
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import InfoTooltip from '@/components/InfoTooltip.vue'
  
  const checkboxInput = ref<HTMLInputElement>()
  
  const props = defineProps<{
    text?: string
    startValue?: boolean
    tooltip?: string
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

<style scoped lang="scss">
  .tooltip-icon {
    margin-left: 0.5rem;
  }
  .container {
    display: flex;
  }
  
  @media screen and (max-width: 600px) {
    .tooltip-icon {
      margin-top: 0.5rem;
      margin-left: calc(2em - 2px);
    }
    .container {
      display: block;
    }
  }
</style>
