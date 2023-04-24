import { UserDB } from '@/firebase/db'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GameSummary, UserDoc } from '@/firebase/db/schema'

export class User {
  public readonly uid: string
  public readonly username: string
  public readonly numGamesPlayed: number
  public readonly numWinPoints: number
  public readonly last5GamesStr: string
  public name?: string
  public about: string
  public profileImg?: string
  public renameAllowedAt: Date | undefined
  public displayName: string
  public latestGames: GameSummary[]
  
  constructor(id: string, doc: UserDoc) {
    const name = doc.name ?? undefined // null -> undefined
    const profileImg = doc.profileImg ?? undefined
    
    this.uid = id
    this.username = doc.IMMUTABLE.username
    this.name = name
    this.about = doc.about
    this.profileImg = profileImg
    this.renameAllowedAt = doc.IMMUTABLE.renameAllowedAt?.toDate()
    this.numGamesPlayed = doc.IMMUTABLE.numGamesPlayed
    this.numWinPoints = doc.IMMUTABLE.numWinPoints
    this.last5GamesStr = doc.IMMUTABLE.last5Games
    this.latestGames = JSON.parse(this.last5GamesStr)
    
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
  
  // Attempt to store a user in the database. This will only succeed if the
  // user is authenticated as the user being stored.
  async function storeUser(user: User): Promise<void> {
    const name = user.name || null // undefined | "" -> null
    const profileImg = user.profileImg ?? null
    await UserDB.updateUser(user.uid, name, user.about, profileImg)
  }
  
  return { getUserById, getUserByUsername, storeUser }
})
