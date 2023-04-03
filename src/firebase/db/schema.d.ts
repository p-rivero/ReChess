
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
  timeUpvoted: FieldValue | Timestamp
}


// variants/{variantId}
export interface VariantDoc {
  name: string
  description: string
  IMMUTABLE: {
    creationTime: FieldValue | Timestamp
    creatorDisplayName: string
    creatorId: string | null
    numUpvotes: number
    // JSON string that corresponds to the Variant interface in src/protochess/types.ts
    // Validated client-side (on every fetch), since server-side validation would require importing
    // the protochess wasm module on the cloud function
    // Also, this object could be quite big and we don't want firebase to create any indexes its fields
    initialState: string
  }
}

// variantIndex/doc
export interface VariantIndexDoc {
  // Read-only summary of all variants, in a single document
  // Each line (NL separated) is a variant with the following format:
  // `${variantId}\t${name}\t${description[0:100]}`
  index: string
}


// games/{gameId}
export interface GameDoc {
  IMMUTABLE: {
    timePlayed: Timestamp
    winner: 'white' | 'black' | 'draw'
    variantName: string
    variantId: string
    whiteDisplayName: string
    whiteId: string | null
    blackDisplayName: string
    blackId: string | null
  }
}
