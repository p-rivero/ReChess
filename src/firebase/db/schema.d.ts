
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
  SERVER: {
    username: string
    numWins: number
  }
}
// users/{userId}/private/doc
export interface UserPrivateDoc {
  SERVER: {
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

// userUpvotes/{userID}
export interface UserUpvotesDoc {
  [variantId: string]: {
    timeUpvoted: Timestamp
    variantName: string
  }
}

// variants/{variantId}
export interface VariantDoc {
  name: string
  creatorId: string
  description: string
  // JSON string that corresponds to the GameState interface in src/protochess/types.ts
  // Validated client-side (on every fetch), since server-side validation would require importing
  // the protochess wasm module on the cloud function
  initialState: string
  SERVER: {
    numUpvotes: number
  }
}
