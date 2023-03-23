<!--
  This component is a vertical gauge that shows the evaluation of the current position.
 -->
 
<template>
  <div class="is-flex">
    <div class="eval-gauge" :class="{'reverse': !whitePov}">
      <div class="black-bar"></div>
      <div class="marker" style="height: 12.5%"></div>
      <div class="marker" style="height: 25%"></div>
      <div class="marker" style="height: 37.5%"></div>
      <div class="center-line" style="height: 50%"></div>
      <div class="marker" style="height: 62.5%"></div>
      <div class="marker" style="height: 75%"></div>
      <div class="marker" style="height: 87.5%"></div>
    </div>
    <div>
      <div class="ml-2 eval-text">{{ evalText }}</div>
      <div class="ml-2 mb-2">{{ depthText }}</div>
      <a v-if="explainText" class="ml-2 is-size-5" @click="explain">
        Why?</a>
    </div>
  </div>
</template>


<script setup lang="ts">
  import type { MakeMoveFlag, MakeMoveWinner, Player } from '@/protochess/types'
  import { getMessage } from '@/utils/chess/game-over-message'
  import { showPopup } from '@/components/PopupMsg/popup-manager'
  import { ref } from 'vue'
  
  defineProps<{
    whitePov: boolean
  }>()
  
  const blackBarHeight = ref('50%')
  const evalText = ref('')
  const depthText = ref('')
  const explainText = ref<string>()
  
  defineExpose({
    updateEvaluation(evaluation: number|`#${number}`, depth: number, invert: boolean) {
      let blackGaugePercent: number
      if (typeof evaluation === 'string' && evaluation.startsWith('#')) {
        const mateIn = parseInt(evaluation.slice(1))
        // Negative adjustedMate means that black is winning
        const adjustedMate = invert ? -mateIn : mateIn
        blackGaugePercent = 100 - mateToWinOdds(adjustedMate)
        evalText.value = `#${adjustedMate}`
      } else if (typeof evaluation === 'number') {
        // Negative adjustedCentipawns means that black is winning
        const adjustedCentipawns = invert ? -evaluation : evaluation
        blackGaugePercent = 100 - cpToWinOdds(adjustedCentipawns)
        const plusSign = adjustedCentipawns > 0 ? '+' : ''
        evalText.value = plusSign + (adjustedCentipawns / 100).toFixed(1)
      } else {
        throw new Error('Unexpected evaluation format: ' + evaluation)
      }
      blackBarHeight.value = `${blackGaugePercent}%`
      depthText.value = `Depth ${depth}`
      explainText.value = undefined
    },
    
    gameOver(flag: MakeMoveFlag, winner: MakeMoveWinner, playerToMove: Player) {
      if (winner === 'white') {
        evalText.value = '1-0'
        blackBarHeight.value = '0%'
      } else if (winner === 'black') {
        evalText.value = '0-1'
        blackBarHeight.value = '100%'
      } else {
        evalText.value = '1/2-1/2'
        blackBarHeight.value = '50%'
      }
      depthText.value = 'Game over'
      explainText.value = getMessage(flag, playerToMove)
    }
  })
  
  function explain() {
    if (!explainText.value) return
    showPopup('Why is the game over?', explainText.value, 'ok')
  }
  
  // Convert centipawns (positive or negative) to the probability of white winning (0 to 100)
  function cpToWinOdds(cp: number): number {
    // https://lichess.org/page/accuracy
    // Lichess uses -0.00368208. Use a less sensitive multiplier to make the gauge more conservative.
    const MULTIPLIER = -0.002
    const winProb = 1 / (1 + Math.exp(MULTIPLIER * cp))
    // Reserve 5% of the gauge for the checkmate evaluation
    return mapToRange(winProb, 2.5, 97.5)
  }
  
  // Convert mate in n moves (positive or negative) to the probability of white winning (0 to 100)
  function mateToWinOdds(mate: number): number {
    const { whiteWinning, absMate } = mate > 0 ? { whiteWinning: true, absMate: mate } : { whiteWinning: false, absMate: -mate }
    // Convert mate in n moves to (n ^ -0.7), to get a score from 0 to 1
    const mateInv = (absMate > 0) ? Math.pow(absMate, -0.7) : 1
    // Map the score to the reserved range of the gauge ([0, 2.5] for black or [97.5, 100] for white)
    if (whiteWinning) {
      return mapToRange(mateInv, 97.5, 100)
    } else {
      return mapToRange(mateInv, 2.5, 0)
    }
  }
  
  // Map a value from the range [0, 1] to the range [minVal, maxVal]
  function mapToRange(value: number, minVal: number, maxVal: number): number {
    return minVal + (maxVal - minVal) * value
  }
  
</script>

<style scoped lang="scss">
  .eval-gauge {
    position: relative;
    display: block;
    width: 20px;
    background-color: #ccc;
    &::after {
      content: "";
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      box-shadow: 0 0 5px rgb(0 0 0 / 60%) inset;
    }
  }
  .eval-gauge .black-bar {
    display: block;
    width: 100%;
    background-color: #0f0f0f;
    height: v-bind(blackBarHeight);
    transition: height 0.5s;
  }
  .eval-gauge.reverse {
    transform: rotate(180deg);
  }
  
  .eval-gauge .center-line {
    position: absolute;
    top: 6px;
    width: 100%;
    border-bottom: 7px solid rgba(214, 79, 0, 0.4);
    margin-top: -3px;
  }
  .eval-gauge .marker {
    position: absolute;
    top: 0;
    width: 100%;
    border-bottom: 2px solid rgba(112, 112, 112, 0.5);
  }
  
  .eval-text {
    font-size: 1.5em;
    font-weight: bold;
    width: 6rem;
  }
</style>