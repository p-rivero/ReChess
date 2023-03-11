
import { Timestamp } from 'firebase/firestore'

// usernames/{username}
export interface UsernameDoc {
  userId: string
}

// users/{userId}
export interface UserDoc {
  name?: string
  about: string
  profileImg?: string
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
  // TODO: Variant itself
  SERVER: {
    numUpvotes: number
  }
}
