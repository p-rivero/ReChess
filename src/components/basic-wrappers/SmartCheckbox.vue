<template>
  <div>
    <div class="is-flex">
      <label class="b-checkbox checkbox">
        <input
          ref="checkboxInput"
          type="checkbox"
          value="false"
          @change="checkboxChanged($event.target)"
        >
        <span class="check" />
        <div class="is-flex is-flex-wrap-wrap">
          <span
            v-if="text"
            class="control-label adjust-text is-align-self-center"
          >{{ text }}</span>
          <InfoTooltip
            v-if="tooltip"
            class="my-1 ml-2"
            :text="tooltip"
          />
        </div>
      </label>
    </div>
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
