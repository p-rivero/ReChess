<template>
  <div
    ref="popup"
    class="modal"
  >
    <div
      class="modal-background"
      @click="_ => { if(!hasImage) closePopup() }"
    />
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">
          Upload image
        </p>
        <button
          class="delete is-large"
          aria-label="close"
          @click="closePopup"
        />
      </header>
      <section class="modal-card-body px-0 py-0">
        <div
          v-show="!hasImage"
          style="position: relative;"
          class="w-100 is-flex-show py-6 is-flex-direction-column is-justify-content-center is-align-items-center"
        >
          <FileDropArea @file-dropped="showImage" />
          <p> Drag and drop your image here </p>
          <p class="my-4">
            or
          </p>
          <button
            ref="buttonUpload"
            class="button is-primary"
            @click="selectFile"
          >
            Upload image
          </button>
          <button
            v-if="showDeleteButton()"
            class="button is-small mt-5"
            @click="() => {
              emit('remove-image')
              closePopup()
            }"
          >
            Delete existing image
          </button>
        </div>
        <ImageCrop
          v-if="hasImage"
          ref="imageCrop"
          :height="450"
          :viewport-diameter="300"
          :output-image-width="uploadedImageWidth"
        />
      </section>
      <footer class="modal-card-foot">
        <div>
          <button
            v-if="hasImage"
            class="button is-primary"
            @click="onUploadClick"
          >
            Upload
          </button>
          <button
            class="button"
            @click="closePopup"
          >
            Cancel
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>


<script setup lang="ts">
  import ImageCrop from './ImageCrop.vue'
  import { nextTick, ref } from 'vue'
  import { importFile } from '@/utils/file-io'
  import { getUrl, uploadBlob } from '@/firebase/storage'
  import type { CacheHeader, Bucket } from '@/firebase/storage'
  import FileDropArea from '../FileDropArea.vue'
  
  const popup = ref<HTMLElement>()
  const buttonUpload = ref<HTMLButtonElement>()
  const imageCrop = ref<InstanceType<typeof ImageCrop>>()
    
  const hasImage = ref(false)
  const loading = ref(false)
  let uploadBlobName = ''
  let uploadBucket: Bucket = 'default'
  
  const props = defineProps<{
    showDeleteButton: () => boolean
    uploadedImageWidth: number
    cache: CacheHeader
  }>()
  
  defineExpose({
    show(bucket: Bucket, uploadName: string) {
      uploadBucket = bucket
      uploadBlobName = uploadName
      popup.value?.classList.add('is-active')
      document.documentElement.classList.add('is-clipped')
      buttonUpload.value?.focus()
    },
    hide: closePopup,
    loading,
  })
  
  const emit = defineEmits<{
    (event: 'image-uploaded', url: string): void
    (event: 'remove-image'): void
    (event: 'upload-error'): void
  }>()
  
  function closePopup() {
    popup.value?.classList.remove('is-active')
    document.documentElement.classList.remove('is-clipped')
    hasImage.value = false
  }
  
  async function selectFile() {
    // Get the new image from the user
    const image = await importFile('image/*')
    showImage(image)
  }
  function showImage(image: Blob) {
    hasImage.value = true
    nextTick(() => {
      imageCrop.value?.setBlob(image)
    })
  }
  
  async function onUploadClick() {
    const blobUrl = await imageCrop.value?.getCroppedPng()
    if (!blobUrl) {
      throw new Error('Could not get cropped image')
    }
    closePopup()
    const image = await fetch(blobUrl).then(r => r.blob())
    await uploadFile(image)
  }
  
  async function uploadFile(image: Blob) {
    // Upload the image to Firebase Storage
    loading.value = true
    try {
      await uploadBlob(image, uploadBucket, uploadBlobName, props.cache)
      const url = await getUrl(uploadBucket, uploadBlobName)
      if (!url) throw new Error('Could not get image URL')
      emit('image-uploaded', url)
    } catch (e) {
      console.error(e)
      emit('upload-error')
    } finally {
      loading.value = false
    }
  }
</script>

<style scoped lang="scss">

</style>
