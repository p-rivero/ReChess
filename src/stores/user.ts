import { defineStore } from 'pinia'
import { ref } from 'vue'
import { UserDB } from '@/firebase/db'
import type { UserDoc } from '@/firebase/db/schema'
import type { Timestamp } from '@firebase/firestore'

export class User {
  public readonly uid: string
  public readonly username: string
  public readonly numWins: number
  public name?: string
  public about: string
  public profileImg?: string
  public renameAllowedAt: Timestamp | null
  public displayName: string
  
  constructor(id: string, doc: UserDoc) {
    const name = doc.name ?? undefined // null -> undefined
    const profileImg = doc.profileImg ?? undefined
    
    this.uid = id
    this.username = doc.IMMUTABLE.username
    this.name = name
    this.about = doc.about
    this.profileImg = profileImg
    this.numWins = doc.IMMUTABLE.numWins
    this.renameAllowedAt = doc.IMMUTABLE.renameAllowedAt
    
    this.displayName = this.name ?? `@${this.username}`
  }
  
  public updateDisplayName() {
    this.displayName = this.name ?? `@${this.username}`
  }
}

export const useUserStore = defineStore('user', () => {
  const lastUserCache = ref<User | undefined>(undefined)
  
  // userId -> User
  async function getUserById(id: string): Promise<User | undefined> {
    if (lastUserCache.value?.uid === id) return lastUserCache.value
    
    const doc = await UserDB.getUserById(id)
    if (!doc) return undefined
    lastUserCache.value = new User(id, doc)
    return lastUserCache.value
  }
  
  // username -> User
  async function getUserByUsername(username: string): Promise<User | undefined> {
    if (lastUserCache.value?.username === username) {
      return lastUserCache.value
    }
    
    const id = await UserDB.getId(username)
    if (!id) return undefined
    const doc = await UserDB.getUserById(id)
    if (!doc) return undefined
    lastUserCache.value = new User(id, doc)
    return lastUserCache.value
  }
  
  // Store a user in the database
  async function storeUser(user: User): Promise<void> {
    const doc: UserDoc = {
      name: user.name || null, // undefined | "" -> null
      about: user.about,
      profileImg: user.profileImg ?? null,
      IMMUTABLE: {
        username: user.username,
        numWins: user.numWins,
        renameAllowedAt: user.renameAllowedAt,
      },
    }
    await UserDB.updateUser(user.uid, doc)
  }
  
  return { getUserById, getUserByUsername, storeUser }
})
