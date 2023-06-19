
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
    lastGamesOpponentIds: string[] // Index of last 5 games
    lastGamesVariantIds: string[] // Index of last 5 games
  }
  // Hidden flag (disallowed by security rules)
  banned?: true
}
export interface GameSummary {
  gameId: string
  variantId: string // TODO: Cascade delete
  variantName: string
  timeCreatedMs: number
  playedSide: 'white' | 'black'
  result: 'win' | 'loss' | 'draw'
  opponentId: string | null
  opponentName: string
}

// users/{userId}/private/doc
export interface UserPrivateDoc {
  IMMUTABLE: {
    email: string
  }
}

// users/{userId}/upvotedVariants/{variantId}
export interface TimestampDoc {
  time: Timestamp
}

// users/{userId}/reportedVariants/{variantId}
// users/{userId}/reportedUsers/{reportedUserId}
export interface ReportDoc extends TimestampDoc {
  reason: string
  onlyBlock: boolean
}

// users/{userId}/privateCache/doc
export interface UserPrivateCacheDoc {
  // Both are a list of space-separated document IDs
  upvotedVariants: string
  reportedVariants: string
  reportedUsers: string
}

// users/{userId}/renameTrigger/doc
export interface UserRenameTriggerDoc {
  // This document is used to trigger a cloud function when the user changes their name
  name: string
  username: string
}


// variants/{variantId}
export interface VariantDoc {
  name: string
  description: string
  creationTime: Timestamp
  creatorDisplayName: string
  creatorId: string | null
  numUpvotes: number
  popularity: number
  tags: string[]
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
  // `${variantId}\t${name}\t${description[0:100]}\t${tags.join(',')}`
  index: string
}


// variants/{variantId}/lobby/{creatorUserId}
export interface LobbySlotDoc {
  IMMUTABLE: {
    creatorDisplayName: string
    creatorImageUrl: string | null
    timeCreated: Timestamp | FieldValue
    requestedColor: RequestedColor
    // null if the creator has not accepted the challenge yet
    gameDocId: string | null
  }
  challengerId: string | null
  challengerDisplayName: string | null
  challengerImageUrl: string | null
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

// userModeration/{userId}
// variantModeration/{variantId}
export interface ModerationDoc {
  numReports: number
  reportsSummary: string
}

// bannedUserData/{userId}
export interface BannedUserDataDoc {
  name: string | null
  about: string
  profileImg: string | null
  // Space-separated lists of variant IDs
  publishedVariants: string
  gamesAsWhite: string
  gamesAsBlack: string
}
