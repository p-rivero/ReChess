import { FUNCTIONS_REGION } from './config'
import { callFunction } from './helpers'
import { region } from 'firebase-functions'

// Lazy load each cloud function to reduce cold start time
// (dynamic imoprts are only loaded once per process, not on each function call)

// Functions below are ordered alphabetically by directory name, as in the file tree
// See each file for the function documentation


// IMPORTANT: When creating a callable function, go to https://console.cloud.google.com/functions
// and give the principal "allUsers" the role "Cloud Functions Invoker" for the function.
// Otherwise, the CORS preflight request will fail.


// FILE-UPLOAD

export const checkPieceHash =
region(FUNCTIONS_REGION)
  .storage
  .bucket('rechess-web-piece-images')
  .object()
  .onFinalize((object) => {
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

export const finishGame =
region(FUNCTIONS_REGION)
  .firestore
  .document('games/{gameId}/gameOverTrigger/doc')
  .onCreate((_snap, context) => {
    return callFunction(import('./game/finish-game'), context.params.gameId)
  })

export const onCreateLobbySlot =
region(FUNCTIONS_REGION)
  .firestore
  .document('variants/{variantId}/lobby/{creatorUserId}')
  .onCreate((_snap, context) => {
    return callFunction(import('./game/on-create-lobby-slot'), context.params.variantId)
  })

export const onRemoveLobbySlot =
region(FUNCTIONS_REGION)
  .firestore
  .document('variants/{variantId}/lobby/{creatorUserId}')
  .onDelete((_snap, context) => {
    return callFunction(import('./game/on-remove-lobby-slot'), context.params.variantId)
  })


// MODERATOR

export const banUser =
region(FUNCTIONS_REGION)
  .runWith({ enforceAppCheck: true })
  .https
  .onCall((data, context) => {
    return callFunction(import('./moderator/ban-user'), data, context)
  })
  
export const deleteVariant =
region(FUNCTIONS_REGION)
  .runWith({ enforceAppCheck: true })
  .https
  .onCall((data, context) => {
    return callFunction(import('./moderator/delete-variant'), data, context)
  })
  
export const discardUserReports =
region(FUNCTIONS_REGION)
  .runWith({ enforceAppCheck: true })
  .https
  .onCall((data, context) => {
    return callFunction(import('./moderator/discard-user-reports'), data, context)
  })

export const discardVariantReports =
region(FUNCTIONS_REGION)
  .runWith({ enforceAppCheck: true })
  .https
  .onCall((data, context) => {
    return callFunction(import('./moderator/discard-variant-reports'), data, context)
  })
  
export const unbanUser =
region(FUNCTIONS_REGION)
  .runWith({ enforceAppCheck: true })
  .https
  .onCall((data, context) => {
    return callFunction(import('./moderator/unban-user'), data, context)
  })
  
export const wipeUser =
region(FUNCTIONS_REGION)
  .runWith({ enforceAppCheck: true })
  .https
  .onCall((data, context) => {
    return callFunction(import('./moderator/wipe-user'), data, context)
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
  .document('users/{userId}/renameTrigger/doc')
  .onUpdate((change, context) => {
    return callFunction(import('./user/rename-user'), change, context.params.userId)
  })

export const reportUser =
region(FUNCTIONS_REGION)
  .firestore
  .document('users/{userId}/reportedUsers/{reportedUserId}')
  .onCreate((snap, context) => {
    return callFunction(import('./user/report-user'), context.params.reportedUserId, context.params.userId, snap)
  })


// VARIANT

export const decrementVariantUpvotes =
region(FUNCTIONS_REGION)
  .firestore
  .document('users/{userId}/upvotedVariants/{variantId}')
  .onDelete((_snap, context) => {
    return callFunction(import('./variant/decrement-variant-upvotes'), context.params.variantId, context.params.userId)
  })

export const incrementVariantUpvotes =
region(FUNCTIONS_REGION)
  .firestore
  .document('users/{userId}/upvotedVariants/{variantId}')
  .onCreate((_snap, context) => {
    return callFunction(import('./variant/increment-variant-upvotes'), context.params.variantId, context.params.userId)
  })
  
export const reportVariant =
region(FUNCTIONS_REGION)
  .firestore
  .document('users/{userId}/reportedVariants/{variantId}')
  .onCreate((snap, context) => {
    return callFunction(import('./variant/report-variant'), context.params.variantId, context.params.userId, snap)
  })

export const updateVariantIndex =
region(FUNCTIONS_REGION)
  .firestore
  .document('variants/{variantId}')
  .onCreate((snap) => {
    return callFunction(import('./variant/update-variant-index'), snap)
  })


// If you need to run server-side code manually, you can use the following template:

// export const manualFunction =
// region(FUNCTIONS_REGION)
//   .https
//   .onRequest(async (_req, resp) => {
//     await callFunction(import('./manual-function'))
//     resp.status(200).send('Done')
//   })

// firebase deploy --only functions:manualFunction
// gcloud functions call manualFunction --project rechess-web --region=europe-west1
// gcloud functions delete manualFunction --project rechess-web --region=europe-west1
