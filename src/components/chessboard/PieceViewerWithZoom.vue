<template>
  <div class="w-100 h-100">
    <PieceViewer
      ref="board"
      class="mb-4"
      :piece="piece"
      :board-size="currentSize"
      :position="currentPosition"
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
          :class="{'is-active': targetSize === button.size && targetPosition === button.position}"
          @click="targetSize = button.size; targetPosition = button.position; animate()"
        >
          <span
            :class="[
              button.icon,
              (targetSize === button.size && targetPosition === button.position) ? 'color-primary' : 'color-theme',
            ]"
          />
        </button>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
  import { objectEquals } from '@/helpers/ts-utils'
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
  
  const targetSize = ref<number>(7)
  const currentSize = ref<number>(7)
  const targetPosition = ref<[number, number]>([3,3])
  const currentPosition = ref<[number, number]>([3,3])
  
  const ZOOM_BUTTONS: {size: number, position: [number, number], icon: string}[][] = [
    [
      { size: 7, position: [3,3], icon: 'icon-zoom1' },
      { size: 15, position: [7,7], icon: 'icon-zoom2' },
    ],
    [
      { size: 15, position: [0,14], icon: 'icon-zoom3' },
      { size: 15, position: [14,14], icon: 'icon-zoom4' },
      { size: 15, position: [0,0], icon: 'icon-zoom5' },
      { size: 15, position: [14,0], icon: 'icon-zoom6' },
    ],
  ]
  
  function animate() {
    function getSizeIncrement() {
      const deltaSize = targetSize.value - currentSize.value
      return Math.sign(deltaSize) * 2
    }
    const startPercent = [currentPosition.value[0] / currentSize.value, currentPosition.value[1] / currentSize.value]
    const deltaSize = targetSize.value - currentSize.value
    function getPositionIncrement(i: 0 | 1) {
      const deltaPosition = targetPosition.value[i] - currentPosition.value[i]
      const targetPercent = targetPosition.value[i] / targetSize.value
      const relativePositionChanging = Math.abs(targetPercent - startPercent[i]) > 0.1
      let speed = 1
      if (relativePositionChanging) {
        if ((deltaSize > 0 && deltaPosition > 2) || (deltaSize < 0 && deltaPosition < -2)) {
          speed = 3
        } else if ((deltaSize > 0 && deltaPosition > 1) || (deltaSize < 0 && deltaPosition < 1)) {
          speed = 2
        }
      }
      return Math.sign(deltaPosition) * speed
    }
    
    const timer = setInterval(async () => {
      if (targetSize.value === currentSize.value && objectEquals(targetPosition.value, currentPosition.value)) {
        clearInterval(timer)
        return
      }
      currentSize.value += getSizeIncrement()
      currentPosition.value[0] += getPositionIncrement(0)
      currentPosition.value[1] += getPositionIncrement(1)
    }, 40)
  }
  
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

