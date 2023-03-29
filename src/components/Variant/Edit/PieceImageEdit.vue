<template>
  <button
    class="button is-outlined mr-4 px-1 py-1 fit-content"
    :class="{'is-danger': error}"
    @click="click"
  >
    <div
      v-if="loading"
      class="button piece-container is-loading is-white is-large"
    />
    <div
      v-else-if="imageUrl"
      class="piece-container"
    >
      <img
        class="piece-image"
        alt="Image of this piece"
        draggable="false"
        :src="imageUrl"
      >
    </div>
    <div
      v-else
      class="piece-container"
    >
      <div class="icon-cross color-black" />
    </div>
    <div class="icon-edit color-theme sz-2" />
  </button>
</template>


<script setup lang="ts">
  import { importFile, hashBlob } from '@/utils/file-io'
  import { uploadBlob, getUrl } from '@/firebase/storage'
  
  import { ref, toRefs } from 'vue'
  
  // Cache is public because averyone can see all piece images. Since the file name is based
  // on the SHA-256 hash, we can cache it forever because we are not expecting hash collisions.
  const PIECE_IMG_CACHE = 'public, max-age=31536000, immutable'
  
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
      // First check if the image already exists
      const existingUrl = await getUrl(filePath)
      if (existingUrl) {
        emit('image-changed', existingUrl)
        return
      }
      // Otherwise, upload the image
      await uploadBlob(file, filePath, PIECE_IMG_CACHE)
      const url = await getUrl(filePath)
      if (!url) throw new Error('Failed to get URL for image that was just uploaded')
      emit('image-changed', url)
    } catch (e) {
      error.value = true
      emit('upload-error')
    } finally {
      loading.value = false
    }
  }
  
</script>


<style scoped lang="scss">
  .piece-container {
    width: 4rem;
    height: 4rem;
    flex-shrink: 0;
    background-color: #b58863;
    border-radius: 0.25rem;
  }
  .piece-image {
    width: 100%;
    height: 100%;
    // Mimic the same rendering as the chessboard
    transform: scale(0.9);
    object-fit: cover;
    object-position: left;
  }
  
  .fit-content {
    height: fit-content;
  }
</style>
