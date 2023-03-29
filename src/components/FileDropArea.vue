<!--
  Use this component to turn its PARENT element into a drop area for files.
  This allows the drop area to have children that can be clicked on.
  The parent element must have a position style set (usually position: relative).
 -->

<template>
  <div
    ref="dropArea"
    class="file-drop-area"
    :data-active="active"
    :mouse-events="false"
  />
</template>


<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref } from 'vue'
  
  const emit = defineEmits<{
    (event: 'file-dropped', file: File): void
  }>()
  

  const dropArea = ref<HTMLElement>()
  const active = ref(false)

  
  function onFileDrop(e: Event) {
    e.preventDefault()
    active.value = false
    if (!(e instanceof DragEvent)) {
      throw new Error('Called onFileDrop on a non-drag event')
    }
    if (!e.dataTransfer || e.dataTransfer.files.length === 0) {
      console.warn('Received drop event without dataTransfer')
      return
    }
    const file = e.dataTransfer.files[0]
    emit('file-dropped', file)
  }
  let timer: number | null = null
  function setActive(e: Event) {
    e.preventDefault()
    if (timer) clearTimeout(timer)
    active.value = true
  }
  function setInactive(e: Event) {
    e.preventDefault()
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      active.value = false
    }, 50) as unknown as number
  }
  
  onMounted(() => {
    const dropAreaElement = dropArea.value
    if (!dropAreaElement) throw new Error('Drop area not defined')
    const parent = dropAreaElement.parentElement
    parent?.addEventListener('dragover', setActive)
    parent?.addEventListener('dragenter', setActive)
    parent?.addEventListener('dragleave', setInactive)
    parent?.addEventListener('drop', onFileDrop)
  })
  onBeforeUnmount(() => {
    const dropAreaElement = dropArea.value
    if (!dropAreaElement) throw new Error('Drop area not defined')
    const parent = dropAreaElement.parentElement
    parent?.removeEventListener('dragover', setActive)
    parent?.removeEventListener('dragenter', setActive)
    parent?.removeEventListener('dragleave', setInactive)
    parent?.removeEventListener('drop', onFileDrop)
  })

</script>

<style scoped lang="scss">
  @import '@/assets/style/variables.scss';
  .file-drop-area {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    
    &[data-active="true"] {
      background-color: rgba($light-brown, 0.2);
    }
  }
</style>