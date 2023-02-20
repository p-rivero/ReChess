<template>
  <PlayableChessBoard ref='board' :size=1000 :white="'human'" :black="'engine'" />
</template>

<script setup lang="ts">
  const board = ref<InstanceType<typeof PlayableChessBoard>>()
  onMounted(() => {
    if (board.value === undefined) {
      throw new Error('Reference to board is undefined')
    }
    board.value.loadFen('rnbqkbnr/pppppppp/8/1PP2PP1/PPPPPPPPPP///PPPPPPPPP/PPPPPPPP/PPPPPKPP w kq - 0 1')
  })
</script>

<script lang="ts">
import {ref, onMounted} from 'vue'
import PlayableChessBoard from '@/components/ChessBoard/PlayableChessBoard.vue'

</script>
