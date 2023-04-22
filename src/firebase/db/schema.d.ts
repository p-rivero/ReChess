
import { FieldValue, Timestamp } from 'firebase/firestore'

// WARNING: The Firebase client requires null instead of undefined
// Use "| null" instead of "?" for optional fields


export type RequestedColor = 'white' | 'black' | 'random'

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
    renameAllowedAt: Timestamp | null
    numGamesPlayed: number
    numWinPoints: number
    last5Games: string // JSON of GameSummary[], updated by cloud function
  }
}
export interface GameSummary {
  gameId: string
  variantId: string
  variantName: string
  timeCreated: Timestamp
  playedSide: 'white' | 'black'
  result: 'win' | 'loss' | 'draw'
  opponentId: string
  opponentName: string
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
  // JSON string that corresponds to the Variant interface in src/protochess/types.d.ts
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
    creatorImageUrl: string | null
    timeCreated: Timestamp | FieldValue
    requestedColor: RequestedColor
  }
  challengerId: string | null
  challengerDisplayName: string | null
  challengerImageUrl: string | null
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
    players: [string, string]
    timeCreated: Timestamp
    variantId: string
    variant: VariantDoc
    whiteId: string
    whiteDisplayName: string
    blackId: string
    blackDisplayName: string
    requestedColor: RequestedColor
    calledFinishGame: boolean
  }
}

// games/{gameId}/gameOverTrigger/doc
export interface GameOverTriggerDoc {
  // This document is used to trigger a cloud function when a game ends
  gameOverTime: Timestamp
}

// cancelledGames/{gameId}
export interface CancelledGameDoc extends GameDoc {
  cancelledByUserId: string
  cancelReason: string
  cancelTime: Timestamp
}
