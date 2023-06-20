
import { type CallableContext, HttpsError } from 'firebase-functions/v1/https'
import { VariantIndexDoc } from 'db/schema'
import { batchedUpdate, useAdmin } from '../helpers'
import { refreshUserLastGames } from '../user/helpers/update-games-cache'
import assertModerator from './helpers/assert-moderator'

/**
 * Called directly by the moderator in order to delete a variant.
 * All the games played on the variant are deleted as well.
 * If the variant does not exist, this function does nothing and returns successfully.
 * @param {any} data The data passed to the function
 * @param {string} data.variantId UID of the variant that the moderator wishes to delete
 * @param {CallableContext} context The context of the function call
 * @return {Promise<void>} A promise that resolves when the function is complete
 * @throws An HTTP error is returned if some of the following errors occur:
 * - The user is not authenticated as a moderator
 * - The variant to be deleted does not exist
 */
export default async function(data: unknown, context: CallableContext): Promise<void> {
  assertModerator(context)
  
  // Validate input
  const { variantId } = data as { variantId: unknown }
  if (!variantId) {
    throw new HttpsError('invalid-argument', 'The function must be called with a variantId.')
  }
  if (typeof variantId !== 'string') {
    throw new HttpsError('invalid-argument', 'The variantId must be a string.')
  }
  
  await deleteVariantLobby(variantId)
  await deleteVariantGames(variantId)
  await deleteVariant(variantId)
  await removeVariantFromSearchIndex(variantId)
}


async function deleteVariant(variantId: string) {
  const { db } = await useAdmin()
  await db.collection('variants').doc(variantId).delete()
  await db.collection('variantModeration').doc(variantId).delete()
}

async function deleteVariantLobby(variantId: string) {
  const { db } = await useAdmin()
  const lobbyDocs = await db.collection('variants').doc(variantId).collection('lobby').get()
  await batchedUpdate(lobbyDocs, (batch, ref) => {
    batch.delete(ref)
  })
}


async function deleteVariantGames(variantId: string) {
  const { db } = await useAdmin()
  const games = await db.collection('games').where('IMMUTABLE.variantId', '==', variantId).get()
  await batchedUpdate(games, (batch, ref) => {
    batch.delete(ref)
  })
  await batchedUpdate(games, (batch, ref) => {
    batch.delete(ref.collection('gameOverTrigger').doc('doc'))
  })
  
  const affectedUsers = await db.collection('users').where('IMMUTABLE.lastGamesVariantIds', 'array-contains', variantId).select().get()
  const affectedUserIds = affectedUsers.docs.map((doc) => doc.id)
  await Promise.all(affectedUserIds.map((userId) => refreshUserLastGames(userId)))
}

async function removeVariantFromSearchIndex(removedVariantId: string) {
  const { db } = await useAdmin()
  const indexes = await db.collection('variantIndex').get()
  let found = false
  
  for (const doc of indexes.docs) {
    const data = doc.data() as VariantIndexDoc
    const indexRows = data.index.split('\n')
    const rowsFiltered = indexRows.filter((row) => !row.startsWith(removedVariantId + '\t'))
    const indexFiltered = rowsFiltered.join('\n')
    if (indexFiltered === data.index) continue
    await db.collection('variantIndex').doc(doc.id).update({ index: indexFiltered })
    found = true
  }
  
  if (!found) {
    console.error(`Could not find index entry for ${removedVariantId}`)
  }
}
