<template>
  <div class="list-container">
    <div
      v-for="(row, i) of moveList"
      :key="i"
    >
      <div
        v-if="row.isSentinel"
        class="ml-2 mb-3 mt-1 bg-mask"
        :class="{'alt-color': indentDepth % 2 === 0}"
      >
        <MoveHistoryView
          :root="row.node"
          :start-at-left="row.startAtLeft"
          :root-move-number="row.moveNumber ?? -99"
          :indent-depth="indentDepth + 1"
          :current-selection="currentSelection"
          @node-clicked="node => emit('node-clicked', node)"
        />
      </div>
      
      <div
        v-else
        class="is-flex"
      >
        <div class="list-number py-1">
          {{ row.moveNum }}
        </div>
        <div
          class="list-move py-1 pl-3"
          :class="{
            'highlight-move': row.leftMove.highlighted,
            'is-clickable': !row.leftMove.highlighted && row.leftMove.move !== '...',
          }"
          @click="row.leftMove.node && emit('node-clicked', row.leftMove.node)"
        >
          {{ row.leftMove.move }}
        </div>
        <div
          class="list-move py-1 pl-3 mr-2"
          :class="{
            'highlight-move': row.rightMove.highlighted,
            'is-clickable': !row.rightMove.highlighted && row.rightMove.move && row.rightMove.move !== '...',
          }"
          @click="row.rightMove.node && emit('node-clicked', row.rightMove.node)"
        >
          {{ row.rightMove.move }}
        </div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import type { MoveTreeNode } from '@/helpers/chess/move-history-manager'

  const props = defineProps<{
    root: MoveTreeNode
    startAtLeft: boolean
    rootMoveNumber: number
    indentDepth: number
    currentSelection?: MoveTreeNode
  }>()
  
  const emit = defineEmits<{
    (event: 'node-clicked', node: MoveTreeNode): void
  }>()
  
  
  
  type FlatList = FlatListEntry[]
  type FlatListEntry = DisplayedMove | BranchSentinel
  
  type FormattedList = FormattedListEntry[]
  type FormattedListEntry = ListRow | BranchSentinel
  
  type ListRow = {
    moveNum: number,
    leftMove: DisplayedMove,
    rightMove: DisplayedMove,
    isSentinel?: false
  }
  type DisplayedMove = {
    move: string
    highlighted?: boolean
    node?: MoveTreeNode
    isSentinel?: false,
  }
  
  type BranchSentinel = {
    isSentinel: true
    node: MoveTreeNode
    startAtLeft: boolean
    moveNumber?: number
  }
  
  const moveList = ref<FormattedList>([])
  
  onMounted(() => {
    // Convert the tree to a flat list of moves, with sentinel values for recursive components
    
    const flatList: FlatList = []
    if (!props.startAtLeft) {
      flatList.push({ move: '...' })
    }
    
    let currentlyAtLeft = props.startAtLeft
    // Initialize the current node to the root, create pseudo-root if necessary
    let currentNode = props.root.move === 'root' ? props.root : { move: 'root', children: [props.root] }
    
    // Keep going down the mainline until we reach a leaf
    while (currentNode) {
      // Reached a leaf, stop
      if (currentNode.children.length === 0) break
      
      if (currentNode.children[0].move === 'root') {
        throw new Error('Unexpected root as a child of another node')
      }
      // Add the next move (this skips the root, which is not a real move)
      flatList.push({
        move: currentNode.children[0].notation,
        highlighted: currentNode.children[0] === props.currentSelection,
        node: currentNode.children[0],
      })

      // If this is a branching point, create a sentinel for each branch
      if (currentNode.children.length > 1) {
        // Make sure DisplayedMoves always come in pairs. When white branches,
        // we need to add padding before and after
        if (currentlyAtLeft) {
          flatList.push({ move: '...' })
        }
        for (let i = 1; i < currentNode.children.length; i++) {
          const child = currentNode.children[i]
          const sentinel: BranchSentinel = {
            isSentinel: true,
            node: child,
            startAtLeft: currentlyAtLeft,
          }
          flatList.push(sentinel)
          flatList.push({ move: '' })
        }
        if (currentlyAtLeft) {
          flatList.push({ move: '...' })
        }
      }
      
      // Go down the mainline. This returns undefined if there are no children
      currentNode = currentNode.children[0]
      currentlyAtLeft = !currentlyAtLeft
    }
    // Make sure DisplayedMoves always come in pairs. When reaching the end,
    // add a padding if black still has to move
    if (flatList.length % 2 === 1) {
      const last = flatList[flatList.length-1]
      if (!last.isSentinel && last.move === '...') flatList.pop()
      else flatList.push({ move: '' })
    }
    
    
    
    // Convert the flat list to a list of rows, with sentinel values for recursive components
    const formattedList: FormattedList = []
    let currentMoveNumber = props.rootMoveNumber
    let decremented = false
    for (let i = 0; i < flatList.length; i += 2) {
      const leftMove = flatList[i]
      const rightMove = flatList[i+1]
      
      // Branch sentinel
      if (leftMove.isSentinel) {
        if (rightMove.isSentinel || rightMove.move !== '') {
          throw new Error('Incorrect sentinel padding in MoveHistoryView')
        }
        // If there are many branches, decrement the move number only once
        if (!decremented) currentMoveNumber--
        decremented = true
        leftMove.moveNumber = currentMoveNumber
        formattedList.push(leftMove)
        continue
      }
      if (decremented && leftMove.move !== '...') currentMoveNumber++
      
      // Normal row
      if (rightMove.isSentinel) {
        throw new Error('Unexpected sentinel value in MoveHistoryView')
      }
      const row: ListRow = {
        moveNum: currentMoveNumber,
        leftMove,
        rightMove,
      }
      formattedList.push(row)
      currentMoveNumber++
      decremented = false
    }
    
    moveList.value = formattedList
  })
  
</script>


<style scoped lang="scss">
  @import '@/assets/style/variables.scss';
  .list-number {
    margin-left: 1rem;
    width: 2.5rem;
    margin-right: 0.5rem;
    border-right: 1px solid $grey;
  }
  .list-move {
    width: 50%;
    border-radius: 0.25rem;
    word-break: break-word;
    &.is-clickable:hover {
      background-color: rgba($brown, 0.2);
    }
  }
  .list-container {
    min-width: 17rem;
  }
  
  .highlight-move {
    background-color: $brown;
    font-weight: 600;
    color: $white;
  }
  
  [data-theme="dark"] .bg-mask {
    background-color: $black-bis;
    &.alt-color {
      background-color: $black-ter;
    }
    border-radius: 0.25rem 0 0 0.25rem;
  }
  [data-theme="light"] .bg-mask {
    background-color: $white-bis;
    &.alt-color {
      background-color: $grey-lighter;
    }
    border-radius: 0.25rem 0 0 0.25rem;
  }
  
</style>
