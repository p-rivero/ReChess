<template>
  <div>
    <PieceViewer
      :size="size"
      :piece="piece"
      :width="width"
      :height="height"
      :position="position"
      @clicked="delta => emit('clicked', delta)"
      
      :key="`${width}-${height}-${position}`"
    />
    
    <br>
    <label class="label">View:</label>
    <div class="field is-grouped is-grouped-multiline" v-for="(group, index) in ZOOM_BUTTONS" :key="index">
      <div class="control" v-for="button in group" :key="`${button.width}-${button.height}-${button.position}`">
        <button class="button view-button px-1 py-1"
          :class="{'is-active': width === button.width && height === button.height && position === button.position}"
          @click="width = button.width; height = button.height; position = button.position"
        >
          <span class="color-theme" :class="button.icon"></span>
        </button>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
  import PieceViewer from './PieceViewer.vue'
  import type { PieceDefinition } from '@/protochess/interfaces'
  import { ref } from 'vue'
  
  defineProps<{
    size: number
    piece: PieceDefinition
  }>()
  
  const emit = defineEmits<{
    (event: 'clicked', delta: [number, number]): void
  }>()
  
  const width = ref<number>(7)
  const height = ref<number>(7)
  type Position = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  const position = ref<Position>('center')
  
  const ZOOM_BUTTONS: {width: number, height: number, position: Position, icon: string}[][] = [
    [
      {width: 7, height: 7, position: 'center', icon: 'icon-zoom1'},
      {width: 15, height: 15, position: 'center', icon: 'icon-zoom2'},
    ],
    [
      {width: 15, height: 15, position: 'top-left', icon: 'icon-zoom3'},
      {width: 15, height: 15, position: 'top-right', icon: 'icon-zoom4'},
      {width: 15, height: 15, position: 'bottom-left', icon: 'icon-zoom5'},
      {width: 15, height: 15, position: 'bottom-right', icon: 'icon-zoom6'},
    ]
  ]
  
</script>

<style scoped lang="scss">
  .view-button {
    width: 4rem;
    height: 4rem;
  }
</style>

