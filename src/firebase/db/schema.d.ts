
import { Timestamp } from 'firebase/firestore'

// WARNING: The Firebase client requires null instead of undefined
// Use "| null" instead of "?" for optional fields


// usernames/{username}
export interface UsernameDoc {
  userId: string
}


// users/{userId}
export interface UserDoc {
  name: string | null
  about: string
  profileImg: string | null
  IMMUTABLE: {
    username: string
    numWins: number
    renameAllowedAt: Timestamp | null
  }
}

// users/{userId}/private/doc
export interface UserPrivateDoc {
  IMMUTABLE: {
    email: string
    banned: boolean
  }
}

// users/{userID}/upvotedVariants/{variantId}
export interface UserUpvotesDoc {
  timeUpvoted: Timestamp
}


// variants/{variantId}
export interface VariantDoc {
  name: string
  description: string
  creationTime: Timestamp
  creatorDisplayName: string
  creatorId: string | null
  numUpvotes: number
  // JSON string that corresponds to the Variant interface in src/protochess/types.ts
  // Validated client-side (on every fetch), since server-side validation would require importing
  // the protochess wasm module on the cloud function
  // Also, this object could be quite big and we don't want firebase to create any indexes its fields
  initialState: string
}

// variantIndex/doc
export interface VariantIndexDoc {
  // Read-only summary of all variants, in a single document
  // Each line (NL separated) is a variant with the following format:
  // `${variantId}\t${name}\t${description[0:100]}`
  index: string
}


// variants/{variantId}/lobby/{creatorUserId}
export interface LobbySlotDoc {
  IMMUTABLE: {
    creatorDisplayName: string
    timeCreated: Timestamp
    requestedColor: 'white' | 'black' | 'random'
  }
  challengerId: string | null
  challengerDisplayName: string | null
  // null if the creator has not accepted the challenge yet
  gameDocId: string | null
}

// games/{gameId}
export interface GameDoc {
  // Space-separared list of moves like "e2e4" or "e7e8=Q". Validated by the opponent.
  moveHistory: string
  playerToMove: 'white' | 'black' | 'game-over'
  // winner = null if game is still in progress. Validated by the opponent.
  winner: 'white' | 'black' | 'draw' | null
  // Set by the cloud function when creating the game
  IMMUTABLE: {
    timeCreated: Timestamp
    variantId: string
    variant: VariantDoc
    whiteDisplayName: string
    whiteId: string | null
    blackDisplayName: string
    blackId: string | null
    // For the challenger to check if the creator is lying about the requested color
    requestedColor: 'white' | 'black' | 'random'
  }
}

// cancelledGames/{gameId}
export interface CancelledGameDoc extends GameDoc {
  cancelledById: string
  cancelReason: string
}
