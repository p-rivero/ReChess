<template>
  <button
    class="button is-outlined mr-4 px-1 py-1 fit-content"
    :class="{'is-danger': error}"
    @click="importFile('image/*').then(setImage)"
  >
    <FileDropArea @file-dropped="setImage" />
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
  import FileDropArea from '@/components/FileDropArea.vue'
  
  import { ref, toRefs } from 'vue'
  import { autoCropSvg, autoCropImage } from '@/utils/image-crop'
  
  // Piece images go in their own bucket so that that we can run the
  // checkPieceHash cloud function only when needed
  const PIECE_IMG_BUCKET = 'piece-images'
  
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
  
  async function setImage(file: Blob) {
    
    // Crop the image so all pieces look the same size
    const RATIO_TARGET = 0.35
    const MAX_HEIGHT = 0.75
    switch (file.type) {
    case 'image/svg+xml': {
      file = await autoCropSvg(file, RATIO_TARGET, MAX_HEIGHT)
      break
    }
    case 'image/png':
    case 'image/webp':
      file = await autoCropImage(file, 512, false, RATIO_TARGET, MAX_HEIGHT)
      break
    case 'image/jpeg':
      file = await autoCropImage(file, 512, true, RATIO_TARGET, MAX_HEIGHT)
      break
    }
    
    loading.value = true
    error.value = false
    // Generate a file name for the image, based on its SHA-256 hash
    const hash = await hashBlob(file)
    const filePath = `piece-images/${hash}`
    
    try {
      // First check if the image already exists
      const existingUrl = await getUrl(PIECE_IMG_BUCKET, filePath)
      if (existingUrl) {
        emit('image-changed', existingUrl)
        return
      }
      // Otherwise, upload the image
      await uploadBlob(file, PIECE_IMG_BUCKET, filePath)
      const url = await getUrl(PIECE_IMG_BUCKET, filePath)
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
    object-fit: cover;
    object-position: left;
  }
  
  .fit-content {
    height: fit-content;
  }
</style>
