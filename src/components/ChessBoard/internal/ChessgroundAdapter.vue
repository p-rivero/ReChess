
<!--
  This component is a low level interface with the chessgroundx UI.
  It does not know anything about the game state or game engine, and is only responsible for rendering the board.
  It's recommended to use the ViewableChessBoard component instead of this one.
-->

<template>
  <div class="chessboard w-100 h-100">
    <div ref="board" class="cg-board-wrap"
      @click="e => onClick(e)"
      @mousedown="startDrag" @mousemove="onDrag" @mouseup="endDrag" @mouseout="endDrag"></div>
  </div>
</template>

<!-- TODO: Make pieceImages and width/height updatable without redrawing entire component -->

<script setup lang="ts">
  import { chessboardSvg } from './boardBackgroudSvg'
  import { Chessground } from 'chessgroundx'
  import type * as cg from 'chessgroundx/types'
  import type { Api } from 'chessgroundx/api'
  import type { Config } from 'chessgroundx/config'
  import type { DrawShape } from 'chessgroundx/draw'
  import { ref, onMounted, computed, onUnmounted } from 'vue'
  
  // Map from piece id to the URL of the image to use
  export type PlayerPieceImages = [string, string][]
  export type PieceImages = {white: PlayerPieceImages, black: PlayerPieceImages}
  
  const props = defineProps<{
    width: number
    height: number
    initialConfig: Config
    whitePov: boolean
    pieceImages: PieceImages
  }>()
  
  const emit = defineEmits<{
    (event: 'clicked', position: cg.Key): void
  }>()

  // When mounted, create the chessground board and store the reference to the API handle
  const board = ref<HTMLElement>()
  let chessgroundApi: Api | undefined = undefined
  onMounted(() => {
    if (board.value === undefined) {
      throw new Error('Reference to board is undefined')
    }
    chessgroundApi = Chessground(board.value, props.initialConfig)
  })
  
  // Board appearance
  const LIGHT_COLOR = '#f0d9b5';
  const DARK_COLOR = '#b58863';
  const backgroundSvg = chessboardSvg(props.width, props.height, LIGHT_COLOR, DARK_COLOR)
  const boardBackground = 'url("data:image/svg+xml;utf8,' + backgroundSvg + '")'
  const squareWidthPercent = 100 / props.width + '%'
  const squareHeightPercent = 100 / props.height + '%'
  
  const sizePercentPerSquare = 100 / Math.max(props.width, props.height)
  const componentHeightPercent = props.height * sizePercentPerSquare
  const componentWidthPercent = props.width * sizePercentPerSquare
  const [wrapWidth, wrapHeight] = 
    (componentWidthPercent === 100) ?
    ['100%', `${componentHeightPercent}%`] :
    [`${componentWidthPercent}%`, '100%']
  
  // Coordinates text colors
  const bottomLeftTextColor = props.height % 2 === 0 ? LIGHT_COLOR : DARK_COLOR
  const bottomLeftTextOpposite = props.height % 2 === 0 ? DARK_COLOR : LIGHT_COLOR
  const topRightTextColor = props.width % 2 === 0 ? LIGHT_COLOR : DARK_COLOR
  const topRightTextOpposite = props.width % 2 === 0 ? DARK_COLOR : LIGHT_COLOR
  const bottomRightTextColor = (props.height + props.width) % 2 === 0 ? DARK_COLOR : LIGHT_COLOR
  const bottomRightTextOpposite = (props.height + props.width) % 2 === 0 ? LIGHT_COLOR : DARK_COLOR
  
  // Expose a subset of the chessground API to the parent component
  defineExpose({
    setConfig: (config: Config) => chessgroundApi!.set(config),
    toggleOrientation: () => chessgroundApi!.toggleOrientation(),
    movePiece: (from: cg.Key, to: cg.Key) => chessgroundApi!.move(from, to),
    setPieces: (diff: cg.PiecesDiff) => chessgroundApi!.setPieces(diff),
    explode: (keys: cg.Key[]) => chessgroundApi!.explode(keys),
    getShapes: () => JSON.parse(JSON.stringify(chessgroundApi!.state.drawable.shapes)) as DrawShape[],
    setShapes: (shapes: DrawShape[]) => chessgroundApi!.setAutoShapes(shapes),
  })
  
  
  function pieceUrl(piece: cg.Alphabet, color: cg.Color): string {
    // a->0, b->1, c->2, ...
    const pieceIndex = piece.charCodeAt(0) - 'a'.charCodeAt(0)
    const images = color === 'white' ? props.pieceImages.white : props.pieceImages.black
    if (images.length <= pieceIndex) return 'none'
    const [_id, pieceUrl] = images[pieceIndex]
    return `url("${pieceUrl}")`
  }
  
  function onClick(e: MouseEvent) {
    if (chessgroundApi === undefined) throw new Error('Chessground API is not initialized')
    const coords: cg.NumberPair = [e.pageX, e.pageY]
    let key = chessgroundApi.getKeyAtDomPos(coords)
    if (key) emit('clicked', key)
  }
  
  let isDragging = false
  let canDragAgain = true
  function startDrag() {
    isDragging = true
  }
  function onDrag(e: MouseEvent) {
    if (isDragging && canDragAgain) {
      canDragAgain = false
      onClick(e)
      setTimeout(() => canDragAgain = true, 10)
    }
  }
  function endDrag() {
    isDragging = false
  }
  
  // Redraw the board when the window is resized
  // https://github.com/lichess-org/chessground/issues/54
  function onResize() {
    chessgroundApi?.redrawAll()
  }
  window.addEventListener('resize', onResize)
  onUnmounted(() => window.removeEventListener('resize', onResize))
  
</script>


<style lang="css">
  
  .chessboard {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .cg-wrap {
    padding-right: v-bind(wrapWidth);
    padding-bottom: v-bind(wrapHeight);
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
    width: v-bind(squareWidthPercent);
    height: v-bind(squareHeightPercent);
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
    width: v-bind(squareWidthPercent);
    height: v-bind(squareHeightPercent);
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
    background-repeat: no-repeat;
  }
  [data-theme="dark"] .chessboard piece._-piece {
    background-color: hsl(0, 0%, 14%);
  }
  [data-theme="light"] .chessboard piece._-piece {
      background-color: hsl(0, 0%, 100%);
  }
  .chessboard square.exploding1 {
    background-image: url('@/assets/board/explosion1.svg');
  }
  .chessboard square.exploding2 {
    background-image: url('@/assets/board/explosion2.svg');
  }
  
  /* Hack for defining custom images with a dynamic name. */
  /* For now, there is a limit of 26 pieces for each player. We could add more by making the mapping more complex */
  .chessboard piece.a-piece.white { background-image: v-bind(pieceUrl('a', 'white')); }
  .chessboard piece.b-piece.white { background-image: v-bind(pieceUrl('b', 'white')); }
  .chessboard piece.c-piece.white { background-image: v-bind(pieceUrl('c', 'white')); }
  .chessboard piece.d-piece.white { background-image: v-bind(pieceUrl('d', 'white')); }
  .chessboard piece.e-piece.white { background-image: v-bind(pieceUrl('e', 'white')); }
  .chessboard piece.f-piece.white { background-image: v-bind(pieceUrl('f', 'white')); }
  .chessboard piece.g-piece.white { background-image: v-bind(pieceUrl('g', 'white')); }
  .chessboard piece.h-piece.white { background-image: v-bind(pieceUrl('h', 'white')); }
  .chessboard piece.i-piece.white { background-image: v-bind(pieceUrl('i', 'white')); }
  .chessboard piece.j-piece.white { background-image: v-bind(pieceUrl('j', 'white')); }
  .chessboard piece.k-piece.white { background-image: v-bind(pieceUrl('k', 'white')); }
  .chessboard piece.l-piece.white { background-image: v-bind(pieceUrl('l', 'white')); }
  .chessboard piece.m-piece.white { background-image: v-bind(pieceUrl('m', 'white')); }
  .chessboard piece.n-piece.white { background-image: v-bind(pieceUrl('n', 'white')); }
  .chessboard piece.o-piece.white { background-image: v-bind(pieceUrl('o', 'white')); }
  .chessboard piece.p-piece.white { background-image: v-bind(pieceUrl('p', 'white')); }
  .chessboard piece.q-piece.white { background-image: v-bind(pieceUrl('q', 'white')); }
  .chessboard piece.r-piece.white { background-image: v-bind(pieceUrl('r', 'white')); }
  .chessboard piece.s-piece.white { background-image: v-bind(pieceUrl('s', 'white')); }
  .chessboard piece.t-piece.white { background-image: v-bind(pieceUrl('t', 'white')); }
  .chessboard piece.u-piece.white { background-image: v-bind(pieceUrl('u', 'white')); }
  .chessboard piece.v-piece.white { background-image: v-bind(pieceUrl('v', 'white')); }
  .chessboard piece.w-piece.white { background-image: v-bind(pieceUrl('w', 'white')); }
  .chessboard piece.x-piece.white { background-image: v-bind(pieceUrl('x', 'white')); }
  .chessboard piece.y-piece.white { background-image: v-bind(pieceUrl('y', 'white')); }
  .chessboard piece.z-piece.white { background-image: v-bind(pieceUrl('z', 'white')); }
  .chessboard piece.a-piece.black { background-image: v-bind(pieceUrl('a', 'black')); }
  .chessboard piece.b-piece.black { background-image: v-bind(pieceUrl('b', 'black')); }
  .chessboard piece.c-piece.black { background-image: v-bind(pieceUrl('c', 'black')); }
  .chessboard piece.d-piece.black { background-image: v-bind(pieceUrl('d', 'black')); }
  .chessboard piece.e-piece.black { background-image: v-bind(pieceUrl('e', 'black')); }
  .chessboard piece.f-piece.black { background-image: v-bind(pieceUrl('f', 'black')); }
  .chessboard piece.g-piece.black { background-image: v-bind(pieceUrl('g', 'black')); }
  .chessboard piece.h-piece.black { background-image: v-bind(pieceUrl('h', 'black')); }
  .chessboard piece.i-piece.black { background-image: v-bind(pieceUrl('i', 'black')); }
  .chessboard piece.j-piece.black { background-image: v-bind(pieceUrl('j', 'black')); }
  .chessboard piece.k-piece.black { background-image: v-bind(pieceUrl('k', 'black')); }
  .chessboard piece.l-piece.black { background-image: v-bind(pieceUrl('l', 'black')); }
  .chessboard piece.m-piece.black { background-image: v-bind(pieceUrl('m', 'black')); }
  .chessboard piece.n-piece.black { background-image: v-bind(pieceUrl('n', 'black')); }
  .chessboard piece.o-piece.black { background-image: v-bind(pieceUrl('o', 'black')); }
  .chessboard piece.p-piece.black { background-image: v-bind(pieceUrl('p', 'black')); }
  .chessboard piece.q-piece.black { background-image: v-bind(pieceUrl('q', 'black')); }
  .chessboard piece.r-piece.black { background-image: v-bind(pieceUrl('r', 'black')); }
  .chessboard piece.s-piece.black { background-image: v-bind(pieceUrl('s', 'black')); }
  .chessboard piece.t-piece.black { background-image: v-bind(pieceUrl('t', 'black')); }
  .chessboard piece.u-piece.black { background-image: v-bind(pieceUrl('u', 'black')); }
  .chessboard piece.v-piece.black { background-image: v-bind(pieceUrl('v', 'black')); }
  .chessboard piece.w-piece.black { background-image: v-bind(pieceUrl('w', 'black')); }
  .chessboard piece.x-piece.black { background-image: v-bind(pieceUrl('x', 'black')); }
  .chessboard piece.y-piece.black { background-image: v-bind(pieceUrl('y', 'black')); }
  .chessboard piece.z-piece.black { background-image: v-bind(pieceUrl('z', 'black')); }
  
</style>
