<template>
  <div class="w-100 h-100">
    <PieceViewer
      ref="board"
      :key="`${width}-${height}-${position}`"
      class="mb-4"
      :piece="piece"
      :width="width"
      :height="height"
      :position="position"
      :get-click-mode="getClickMode"
      :cursor-pointer="cursorPointer"
      @clicked="(delta, mode) => emit('clicked', delta, mode)"
    />
    
    <div class="columns">
      <div class="column is-flex">
        <div class="legend-square green" />
        <label class="mx-2">Only move</label>
      </div>
      <div class="column is-flex">
        <div class="legend-square red" />
        <label class="mx-2">Only capture</label>
      </div>
      <div class="column is-flex">
        <div class="legend-square purple" />
        <label class="mx-2">Move + capture</label>
      </div>
      <div class="column is-flex">
        <div class="legend-square orange" />
        <label class="mx-2">Explode</label>
      </div>
    </div>
    
    <label class="label">View:</label>
    <div
      v-for="(group, groupIndex) of ZOOM_BUTTONS"
      :key="groupIndex"
      class="field is-grouped is-grouped-multiline"
    >
      <div
        v-for="(button, buttonIndex) of group"
        :key="buttonIndex"
        class="control"
      >
        <button
          class="button view-button px-1 py-1"
          :class="{'is-active': width === button.width && height === button.height && position === button.position}"
          @click="width = button.width; height = button.height; position = button.position"
        >
          <span
            :class="[
              button.icon,
              (width === button.width && height === button.height && position === button.position) ? 'color-primary' : 'color-theme',
            ]"
          />
        </button>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
  import { ref, toRefs } from 'vue'
  import PieceViewer from './PieceViewer.vue'
  import type { FullPieceDef } from '@/protochess/types'
  
  const board = ref<InstanceType<typeof PieceViewer>>()
  
  const props = defineProps<{
    piece: FullPieceDef
    cursorPointer?: boolean
    getClickMode?: (position: [number, number]) => 'add'|'remove'
  }>()
  const { piece } = toRefs(props)
  
  const emit = defineEmits<{
    (event: 'clicked', delta: [number, number], mode?: 'add'|'remove'): void
  }>()
  
  defineExpose({
    redraw: () => board.value?.redraw(),
  })
  
  const width = ref<number>(7)
  const height = ref<number>(7)
  type Position = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  const position = ref<Position>('center')
  
  const ZOOM_BUTTONS: {width: number, height: number, position: Position, icon: string}[][] = [
    [
      { width: 7, height: 7, position: 'center', icon: 'icon-zoom1' },
      { width: 15, height: 15, position: 'center', icon: 'icon-zoom2' },
    ],
    [
      { width: 15, height: 15, position: 'top-left', icon: 'icon-zoom3' },
      { width: 15, height: 15, position: 'top-right', icon: 'icon-zoom4' },
      { width: 15, height: 15, position: 'bottom-left', icon: 'icon-zoom5' },
      { width: 15, height: 15, position: 'bottom-right', icon: 'icon-zoom6' },
    ],
  ]
  
</script>

<style scoped lang="scss">
  .view-button {
    width: 4rem;
    height: 4rem;
  }
  
  .legend-square {
    width: 1rem;
    height: 1.5rem;
    border-radius: 0.2rem;
    flex-shrink: 0;
    &.green {
      background-color: green;
    }
    &.red {
      background-color: red;
    }
    &.purple {
      background-color: purple;
    }
    &.orange {
      background-color: darkorange;
    }
  }
</style>

