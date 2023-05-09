import { UserDB } from '@/firebase/db'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth-user'
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
  const authStore = useAuthStore()
  
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
    
    const user = await UserDB.getUserByUsername(username)
    if (!user) return undefined
    const [id, doc] = user
    lastUserCache.value = new User(id, doc)
    return lastUserCache.value
  }
  
  // Attempt to store a user in the database. This will only succeed if the
  // user is authenticated as the user being stored.
  async function storeUser(user: User, updateName = false): Promise<void> {
    const name = user.name || null // undefined | "" -> null
    const profileImg = user.profileImg ?? null
    await UserDB.updateUser(user.uid, name, user.about, profileImg, updateName)
  }
  
  // Block a user, and optionally report them. This will only succeed if the user is authenticated.
  async function blockUser(id: string, report: true, reason: string): Promise<void>
  async function blockUser(id: string, report: false): Promise<void>
  async function blockUser(id: string, report: boolean, reason?: string): Promise<void> {
    if (!authStore.loggedUser) {
      throw new Error('User must be logged in to report a user')
    }
    if (!report && reason) {
      throw new Error('When blocking a user, do not provide a reason')
    }
    const onlyBlock = !report
    await UserDB.reportUser(authStore.loggedUser.uid, id, onlyBlock, reason ?? '')
    authStore.loggedUser?.reportedUsers.push(id)
  }
  
  return { getUserById, getUserByUsername, storeUser, blockUser }
})
