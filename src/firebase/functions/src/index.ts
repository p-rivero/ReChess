import { region } from 'firebase-functions'
import { callFunction } from './helpers'
import { FUNCTIONS_REGION } from './config'

// Lazy load each cloud function to reduce cold start time
// (dynamic imoprts are only loaded once per process, not on each function call)

// Functions below are ordered alphabetically by directory name, as in the file tree
// See each file for the function documentation


// FILE-UPLOAD

export const checkPieceHash =
region(FUNCTIONS_REGION)
  .storage
  .bucket('rechess-web-piece-images')
  .object()
  .onFinalize(async (object) => {
    return callFunction(import('./file-upload/check-piece-hash'), object)
  })


// GAME

export const cancelGame =
region(FUNCTIONS_REGION)
  .runWith({ enforceAppCheck: true })
  .https
  .onCall((data, context) => {
    return callFunction(import('./game/cancel-game'), data, context)
  })

export const createGame =
region(FUNCTIONS_REGION)
  .runWith({ enforceAppCheck: true })
  .https
  .onCall((data, context) => {
    return callFunction(import('./game/create-game'), data, context)
  })


// USER

export const deleteUser =
region(FUNCTIONS_REGION)
  .auth
  .user()
  .onDelete((user) => {
    return callFunction(import('./user/delete-user'), user)
  })

export const renameUser =
region(FUNCTIONS_REGION)
  .firestore
  .document('users/{userId}')
  .onUpdate((change, context) => {
    return callFunction(import('./user/rename-user'), change, context.params.userId)
  })


// VARIANT

export const decrementVariantUpvotes =
region(FUNCTIONS_REGION)
  .firestore
  .document('users/{userId}/upvotedVariants/{variantId}')
  .onDelete((_snap, context) => {
    return callFunction(import('./variant/decrement-variant-upvotes'), context.params.variantId)
  })

export const incrementVariantUpvotes =
region(FUNCTIONS_REGION)
  .firestore
  .document('users/{userId}/upvotedVariants/{variantId}')
  .onCreate((_snap, context) => {
    return callFunction(import('./variant/increment-variant-upvotes'), context.params.variantId)
  })

export const updateVariantIndex =
region(FUNCTIONS_REGION)
  .firestore
  .document('variants/{variantId}')
  .onCreate((snap) => {
    return callFunction(import('./variant/update-variant-index'), snap)
  })
