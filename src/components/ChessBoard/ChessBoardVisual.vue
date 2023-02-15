
<template>
  <div class="chessboard">
    <div ref="board" class="cg-board-wrap"></div>
  </div>
</template>

<script setup lang="ts">
  import { chessboardSvg } from './boardBackgroudSvg'
  import { Chessground } from 'chessgroundx'
  import type { Config } from 'chessgroundx/config';
  import { ref, onMounted } from 'vue';
  
  const props = defineProps<{
    width: number
    height: number
    size: number
  }>()
  
  const boardConfig: Config = {
    orientation: 'white',
    turnColor: 'white',
    autoCastle: false,
    viewOnly: false,
    disableContextMenu: true,
    blockTouchScroll: true,
    addPieceZIndex: true,
    dimensions: {
      width: props.width,
      height: props.height,
    },
    premovable: {
      enabled: false,
    },
    drawable: {
      defaultSnapToValidMove: false,
    },
  }

  const board = ref<HTMLElement | null>(null)
  onMounted(() => {
    if (board.value === null) {
      throw new Error('reference to board is null')
    }
    Chessground(board.value, boardConfig)
  })
  
  // Board appearance
  const LIGHT_COLOR = '#f0d9b5';
  const DARK_COLOR = '#b58863';
  const backgroundSvg = chessboardSvg(props.width, props.height, LIGHT_COLOR, DARK_COLOR)
  const boardBackground = 'url("data:image/svg+xml;utf8,' + backgroundSvg + '")'
  const widthPercent = 100 / props.width + '%'
  const heightPercent = 100 / props.height + '%'
  
  const sizePerSquare = props.size / Math.max(props.width, props.height)
  const componentHeight = props.height * sizePerSquare + 'px'
  const componentWidth = props.width * sizePerSquare + 'px'
  
  const bottomLeftTextColor = props.height % 2 === 0 ? LIGHT_COLOR : DARK_COLOR
  const bottomLeftTextOpposite = props.height % 2 === 0 ? DARK_COLOR : LIGHT_COLOR
  const topRightTextColor = props.width % 2 === 0 ? LIGHT_COLOR : DARK_COLOR
  const topRightTextOpposite = props.width % 2 === 0 ? DARK_COLOR : LIGHT_COLOR
  const bottomRightTextColor = (props.height + props.width) % 2 === 0 ? DARK_COLOR : LIGHT_COLOR
  const bottomRightTextOpposite = (props.height + props.width) % 2 === 0 ? LIGHT_COLOR : DARK_COLOR
</script>

<style lang="css">
  
  .chessboard {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .cg-wrap {
    width: v-bind(componentWidth);
    height: v-bind(componentHeight);
    position: relative;
    display: block;
  }
  
  cg-board {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    line-height: 0;
    background-size: cover;
    cursor: pointer;
  }
  cg-board square {
    position: absolute;
    top: 0;
    left: 0;
    width: v-bind(widthPercent);
    height: v-bind(heightPercent);
    pointer-events: none;
  }
  cg-board square.move-dest {
    background: radial-gradient(rgba(20, 85, 30, 0.5) 22%, #208530 0, rgba(0, 0, 0, 0.3) 0, rgba(0, 0, 0, 0) 0);
    pointer-events: auto;
  }
  cg-board square.premove-dest {
    background: radial-gradient(rgba(20, 30, 85, 0.5) 22%, #203085 0, rgba(0, 0, 0, 0.3) 0, rgba(0, 0, 0, 0) 0);
  }
  cg-board square.oc.move-dest {
    background: radial-gradient(transparent 0%, transparent 80%, rgba(20, 85, 0, 0.3) 80%);
  }
  cg-board square.oc.premove-dest {
    background: radial-gradient(transparent 0%, transparent 80%, rgba(20, 30, 85, 0.2) 80%);
  }
  cg-board square.move-dest:hover {
    background: rgba(20, 85, 30, 0.3);
  }
  cg-board square.premove-dest:hover {
    background: rgba(20, 30, 85, 0.2);
  }
  cg-board square.last-move {
    will-change: transform;
    background-color: rgba(155, 199, 0, 0.41);
  }
  cg-board square.selected {
    background-color: rgba(20, 85, 30, 0.5);
  }
  cg-board square.check {
    background: radial-gradient(ellipse at center, rgba(255, 0, 0, 1) 0%, rgba(231, 0, 0, 1) 25%, rgba(169, 0, 0, 0) 89%, rgba(158, 0, 0, 0) 100%);
  }
  cg-board square.current-premove {
    background-color: rgba(20, 30, 85, 0.5);
  }
  .cg-wrap piece {
    position: absolute;
    top: 0;
    left: 0;
    width: v-bind(widthPercent);
    height: v-bind(heightPercent);
    background-size: cover;
    z-index: 2;
    will-change: transform;
    pointer-events: none;
  }
  cg-board piece.dragging {
    cursor: move;
    z-index: 10;
  }
  cg-board piece.anim {
    z-index: 8;
  }
  cg-board piece.fading {
    z-index: 1;
    opacity: 0.5;
  }
  .cg-wrap square.move-dest:hover {
    background-color: rgba(20, 85, 30, 0.3);
  }
  .cg-wrap piece.ghost {
    opacity: 0.3;
  }
  .cg-wrap .cg-shapes, .cg-wrap .cg-custom-svgs {
    overflow: hidden;
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .cg-wrap .cg-shapes {
    opacity: 0.6;
    z-index: 2;
  }
  .cg-wrap .cg-custom-svgs {
    /* over piece.anim = 8, but under piece.dragging = 10 */
    z-index: 9;
  }
  .cg-wrap coords {
    --coord-light: #f0d9b5;
    --coord-dark: #946f51;
    position: absolute;
    display: flex;
    pointer-events: none;
    font-weight: bold;
    font-family: monospace;
    font-size: 12px;
  }
  .cg-wrap coords.side {
    right: 2px;
    top: 0;
    flex-flow: column-reverse;
    text-align: right;
    height: 100%;
  }
  .cg-wrap coords.side.black {
    flex-flow: column;
  }
  .cg-wrap coords.bottom {
    bottom: 0;
    left: 2px;
    text-align: left;
    flex-flow: row;
    width: 100%;
  }
  .cg-wrap coords.bottom.black {
    flex-flow: row-reverse;
  }
  
  .cg-wrap coords coord {
    flex: 1 1 auto;
  }
  
  .cg-wrap coords.side coord:nth-child(2n+1) {
    color: v-bind(bottomRightTextColor)
  }
  .cg-wrap coords.side coord:nth-child(2n) {
    color: v-bind(bottomRightTextOpposite)
  }
  .cg-wrap coords.side.black coord:nth-child(2n+1) {
    color: v-bind(topRightTextColor)
  }
  .cg-wrap coords.side.black coord:nth-child(2n) {
    color: v-bind(topRightTextOpposite)
  }
  
  .cg-wrap coords.bottom coord:nth-child(2n+1) {
    color: v-bind(bottomLeftTextColor)
  }
  .cg-wrap coords.bottom coord:nth-child(2n) {
    color: v-bind(bottomLeftTextOpposite)
  }
  .cg-wrap coords.bottom.black coord:nth-child(2n+1) {
    color: v-bind(bottomRightTextColor)
  }
  .cg-wrap coords.bottom.black coord:nth-child(2n) {
    color: v-bind(bottomRightTextOpposite)
  }
  
  
  /* BOARD IMAGES */
 
  .chessboard .cg-wrap {
    background-image: v-bind(boardBackground);
  }
  
  .chessboard piece.p-piece.white {
    background-image: url('./images/pieces/merida/wP.svg');
  }
  .chessboard piece.b-piece.white {
    background-image: url('./images/pieces/merida/wB.svg');
  }
  .chessboard piece.n-piece.white {
    background-image: url('./images/pieces/merida/wN.svg');
  }
  .chessboard piece.r-piece.white {
    background-image: url('./images/pieces/merida/wR.svg');
  }
  .chessboard piece.q-piece.white {
    background-image: url('./images/pieces/merida/wQ.svg');
  }
  .chessboard piece.k-piece.white {
    background-image: url('./images/pieces/merida/wK.svg');
  }
  .chessboard piece.p-piece.black {
    background-image: url('./images/pieces/merida/bP.svg');
  }
  .chessboard piece.b-piece.black {
    background-image: url('./images/pieces/merida/bB.svg');
  }
  .chessboard piece.n-piece.black {
    background-image: url('./images/pieces/merida/bN.svg');
  }
  .chessboard piece.r-piece.black {
    background-image: url('./images/pieces/merida/bR.svg');
  }
  .chessboard piece.q-piece.black {
    background-image: url('./images/pieces/merida/bQ.svg');
  }
  .chessboard piece.k-piece.black {
    background-image: url('./images/pieces/merida/bK.svg');
  }
  
</style>
