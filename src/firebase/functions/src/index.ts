import { region } from 'firebase-functions'
import { callFunction } from './helpers'

// Lazy load each cloud function to reduce cold start time
// (dynamic imoprts are only loaded once per process, not on each function call)

export const renameUser =
region('europe-west1')
.firestore
.document('users/{userId}')
.onUpdate((change, context) => {
  return callFunction(import('./rename-user'), change, context.params.userId)
})

export const deleteUser =
region('europe-west1')
.auth
.user()
.onDelete(user => {
  return callFunction(import('./delete-user'), user)
})

export const updateVariantIndex =
region('europe-west1')
.firestore
.document('variants/{variantId}')
.onCreate(snap => {
  return callFunction(import('./update-variant-index'), snap)
})

export const incrementVariantUpvotes =
region('europe-west1')
.firestore
.document('users/{userId}/upvotedVariants/{variantId}')
.onCreate((_snap, context) => {
  return callFunction(import('./increment-variant-upvotes'), context.params.variantId)
})

export const decrementVariantUpvotes =
region('europe-west1')
.firestore
.document('users/{userId}/upvotedVariants/{variantId}')
.onDelete((_snap, context) => {
  return callFunction(import('./decrement-variant-upvotes'), context.params.variantId)
})


export const checkPieceHash =
region('europe-west1')
.storage
.object()
.onFinalize(async object => {
  return callFunction(import('./check-piece-hash'), object)
})
