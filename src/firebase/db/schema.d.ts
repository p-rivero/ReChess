
import { FieldValue, Timestamp } from 'firebase/firestore'

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
  }
}
// users/{userId}/private/doc
export interface UserPrivateDoc {
  IMMUTABLE: {
    email: string
    banned: boolean
  }
}
// users/{userId}/games/{gameId}
export interface UserGameDoc {
  timePlayed: Timestamp
  result: 'win' | 'lose' | 'draw'
  variantName: string
}

// users/{userID}/upvotedVariants/{variantId}
export interface UserUpvotesDoc {
  timeUpvoted: FieldValue | Timestamp
}

// variants/{variantId}
export interface VariantDoc {
  name: string
  description: string
  IMMUTABLE: {
    creatorDisplayName: string
    creatorId: string
    // JSON string that corresponds to the GameState interface in src/protochess/types.ts
    // Validated client-side (on every fetch), since server-side validation would require importing
    // the protochess wasm module on the cloud function
    // Also, this object could be quite big and we don't want firebase to create any indexes its fields
    initialState: string
  }
}

// variants/{variantId}/upvotes/doc
export interface VariantUpvotesDoc {
  numUpvotes: number
}
