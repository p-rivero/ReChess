<template>
  <button class="button is-outlined mr-4 px-1 py-1 fit-content" @click="click"
    :class="{'is-danger': error}">
    <div v-if="loading" class="button piece-image is-loading is-white is-large"></div>
    <img v-else-if="imageUrl" class="piece-image is-loading" alt="piece image" draggable="false" :src="imageUrl" />
    <div v-else class="piece-image is-loading">
      <div class="icon-cross color-black"></div>
    </div>
    <div class="icon-edit color-theme sz-2"></div>
  </button>
</template>


<script setup lang="ts">
  import { importFile, hashBlob } from "@/utils/file-io"
  import { uploadBlob, getUrl } from "@/firebase/storage"
  
  import { ref, toRefs } from "vue"
  
  const props = defineProps<{
    imageUrl?: string|null
  }>()
  
  const emit = defineEmits<{
    (e: 'image-changed', fileName: string): void
    (e: 'upload-error'): void
  }>()
  
  const { imageUrl } = toRefs(props)
  const loading = ref(false)
  const error = ref(false)
  
  async function click() {
    const file = await importFile('image/*')
    loading.value = true
    error.value = false
    // Generate a file name for the image, based on its SHA-256 hash
    const hash = await hashBlob(file)
    const filePath = `piece-images/${hash}`
    try {
      await uploadBlob(file, filePath)
      const url = await getUrl(filePath)
      emit('image-changed', url)
    } catch (e) {
      error.value = true
      emit('upload-error')
    } finally {
      loading.value = false
    }
  }
  
</script>


<style scoped>
  .piece-image {
    width: 4rem;
    height: 4rem;
    flex-shrink: 0;
    background-color: #b58863;
    border-radius: 0.25rem;
  }
  
  .fit-content {
    height: fit-content;
  }
</style>
