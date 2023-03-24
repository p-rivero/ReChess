import { region } from 'firebase-functions'
import { callFunction } from './helpers'

// Lazy load each cloud function to reduce cold start time
// (dynamic imoprts are only loaded once per process, not on each function call)

export const renameUser =
  region('europe-west1')
    .firestore
    .document('users/{userId}')
    .onUpdate((change, context) => {
      return callFunction(import('./rename-user'), change, context)
    })

export const deleteUser =
  region('europe-west1')
    .auth
    .user()
    .onDelete((user) => {
      return callFunction(import('./delete-user'), user)
    })
  
