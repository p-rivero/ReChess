<!-- 
  This component is a vertical gauge that shows the evaluation of the current position.
 -->
 
<template>
  <div class="eval-gauge" :class="{'reverse': !whitePov}">
    <div class="black-bar"></div>
  </div>
</template>


<script setup lang="ts">
  import { ref } from 'vue'
  
  defineProps<{
    whitePov: boolean
  }>()
  
  const blackBarHeight = ref('50%')
  
  defineExpose({
    // todo està al reves
    updateEvaluation(evaluation: number|`#${number}`, invert: boolean) {
      console.log('eval', evaluation)
      let blackGaugePercent: number
      if (typeof evaluation === 'string' && evaluation.startsWith('#')) {
        const mateIn = parseInt(evaluation.slice(1))
        // Negative adjustedMate means that black is winning
        const adjustedMate = invert ? -mateIn : mateIn
        blackGaugePercent = 100 - mateToWinOdds(adjustedMate)
      } else if (typeof evaluation === 'number') {
        // Negative adjustedCentipawns means that black is winning
        const adjustedCentipawns = invert ? -evaluation : evaluation
        blackGaugePercent = 100 - cpToWinOdds(adjustedCentipawns)
      } else {
        throw new Error('Unexpected evaluation format: ' + evaluation)
      }
      console.log('percent', -blackGaugePercent)
      blackBarHeight.value = `${blackGaugePercent}%`
    }
  })
  
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
    display: block;
    width: 20px;
    height: 200px;
    background-color: #ccc;
  }
  .eval-gauge .black-bar {
    display: block;
    width: 100%;
    height: 50%;
    background-color: #000;
    height: v-bind(blackBarHeight);
    transition: height 0.5s;
  }
  .eval-gauge.reverse {
    transform: rotate(180deg);
  }
</style>