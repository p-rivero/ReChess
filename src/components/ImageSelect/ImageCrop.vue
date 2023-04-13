<!--
  Vue component to crop images using the cropme library
 -->
 
<template>
  <div
    ref="cropmeContainer"
    class="cropme-container"
  />
</template>


<script setup lang="ts">
  import { CircleCropme } from './circle-cropme'
  import { onBeforeUnmount, onMounted, ref } from 'vue'
  
  let cropme: CircleCropme | null = null
  const cropmeContainer = ref<HTMLElement>()
  
  const props = defineProps<{
    height: number
    viewportDiameter: number
    outputImageWidth: number
  }>()
  
  onMounted(() => {
    if (!cropmeContainer.value) {
      throw new Error('Cropme container not found')
    }
    cropme = new CircleCropme(cropmeContainer.value, props.height, props.viewportDiameter)
  })
  onBeforeUnmount(() => {
    cropme?.destroy()
  })
  
  defineExpose({
    setBlob: (blob: Blob) => cropme?.bind(blob),
    getCroppedImage: () => cropme?.cropImage(props.outputImageWidth),
  })
</script>


<style lang="scss">
@import '@/assets/style/variables.scss';

.cropme-wrapper {
  width: 100%;
  height: 100%;
}
.cropme-container {
  position: relative;
  overflow: hidden;
  margin: 0 auto;
  img {
    width: initial;
    cursor: move;
    opacity: 0;
    touch-action: none;
  }
}
#img {
  border: 5px solid #f00;
}

.viewport {
  box-sizing: content-box;
  position: absolute;
  border-style: solid;
  margin: auto;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  box-shadow: 0 0 2000px 2000px rgba(0, 0, 0, 0.5);
  z-index: 0;
  pointer-events: none;
  &.circle {
    border-radius: 50%;
  }
}

.cropme-slider,.cropme-rotation-slider {
  text-align: center;
  position: relative;
  margin: 0 auto;
  margin-bottom: 1rem;
  transform: none !important;
  margin-top: 0 !important;
  
  @media screen and (max-width: 600px) {
    width: 100% !important;
  }
  
  input {
    
    appearance: none;
    -webkit-appearance: none;
    &::-webkit-slider-runnable-track {
      height: 0.3rem;
      background: $white-ter;
      border-radius: 0.3rem;
    }
    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      height: 1.4rem;
      width: 1.4rem;
      border-radius: 50%;
      background: $grey-light;
      margin-top: -0.5rem;
    }
    &:focus {
      outline: none;
    }
    @media screen and (max-width: 600px) {
      width: 100% !important;
    }
  }
}
</style>