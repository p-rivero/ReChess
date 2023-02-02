<template>
  <p><b>Board state:</b></p>
  <span style="white-space: pre; font-family: monospace" id="boardDisplay"></span>
  <p style="white-space: pre; color: darkred" id="boardStatus"></p>
  <br/>
  <form>
    <label for="manualMoveInput"><b>Make move (human):</b></label><br>
    <input type="text" id="manualMoveInput">
    <input type="button" @click="manualMoveButtonClick" id="manualMoveButton" value="Go"/>
    <p>Examples: "e2e4", "e1h1" (short castle), "a7a8=2 (promote to piece type with ID 2, by default Q=1, R=2, B=3, N=4)"</p>
    <p style="color: red" id="manualMoveError"></p>
  </form> 
  <br/>
  <form>
    <label for="engineMoveInput"><b>Make move (engine):</b></label><br>
    <input type="text" id="engineMoveInput" placeholder="Time to search (seconds)">
    <input type="button" @click="engineMoveButtonClick" id="engineMoveButton" value="Go"/>
    <p style="color: red" id="engineMoveError"></p>
    <p id="engineDepth"></p>
  <br/>
  </form>
    <label for="fenInput"><b>Load FEN:</b></label><br>
    <input type="text" id="fenInput" placeholder="FEN string">
    <input type="button" @click="fenButtonClick" id="fenButton" value="Load"/>
    <p style="color: red" id="fenError"></p>
  <br/>
</template>

<script setup lang="ts">

  async function updateBoard(result: string, winner?: number) {
    // boardDisplay.innerHTML = await protochess.to_string()
    // if (result !== 'Ok') {
    //   let winnerString
    //   if (winner === 0) {
    //     winnerString = 'White wins'
    //   } else if (winner === 1) {
    //     winnerString = 'Black wins'
    //   } else {
    //     winnerString = 'Draw'
    //   }
    //   boardStatus.innerHTML = result + ', ' + winnerString
    // } else if (await protochess.to_move_in_check()) {
    //   boardStatus.innerHTML = 'Check!'
    // } else {
    //   boardStatus.innerHTML = ' '
    // }
  }
  function clearErrors() {
    // manualMoveError.innerHTML = ''
    // engineMoveError.innerHTML = ''
    // fenError.innerHTML = ''
  }


  // BUTTON CLICK HANDLERS

  async function manualMoveButtonClick() {
    // clearErrors()
    // try {
    //   // Attempt to make the move
    //   const {result, winner_player} = await protochess.make_move_str(manualMoveInput.value)
    //   if (result === 'IllegalMove') {
    //     throw 'This move is illegal'
    //   }
    //   updateBoard(result, winner_player)
    // } catch (e) {
    //   manualMoveError.innerHTML = e
    // }
  }

  async function engineMoveButtonClick() {
    // clearErrors()
    // engineDepth.innerHTML = 'Searching...'
    // try {
    //   // Attempt to convert the input to a number
    //   const timeout = Number(engineMoveInput.value)
    //   if (isNaN(timeout)) {
    //     throw engineMoveInput.value + ' is not a valid number'
    //   }
    //   if (timeout < 0) {
    //     throw 'Timeout must be >= 0'
    //   }
    //   // Get the engine to make a move
    //   const {make_move_result, depth} = await protochess.play_best_move_timeout(timeout)
    //   const {result, winner_player} = make_move_result
    //   await updateBoard(result, winner_player)
    //   engineDepth.innerHTML = 'Done! Search depth: ' + depth
    // } catch (e) {
    //   engineMoveError.innerHTML = e
    // }
  }

  async function fenButtonClick() {
    // clearErrors()
    // try {
    //   // Attempt to set the FEN
    //   await protochess.load_fen(fenInput.value)
    //   updateBoard('Ok')
    // } catch (e) {
    //   fenError.innerHTML = e
    // }
  }

</script>
