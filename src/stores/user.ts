import { defineStore } from 'pinia'
import { UserDB } from '@/firebase/db'
import type { UserDoc } from '@/firebase/db/schema'
import { ref } from 'vue'

export class User {
  public readonly uid: string
  public readonly username: string
  public readonly name?: string
  public readonly about?: string
  public readonly profileImg?: string
  public readonly displayName: string
  
  constructor(uid: string, username: string, name?: string, about?: string, profileImg?: string) {
    this.uid = uid
    this.username = username
    this.name = name
    this.about = about
    this.profileImg = profileImg
    this.displayName = name ?? `@${username}`
  }
  
  static fromDoc(id: string, doc: UserDoc): User {
    const name = doc.name ?? undefined
    const profileImg = doc.profileImg ?? undefined
    return new User(id, doc.IMMUTABLE.username, name, doc.about, profileImg)
  }
}

export const useUserStore = defineStore('user', () => {
  const lastUserCache = ref<User | undefined>(undefined)
  
  async function getUserById(id: string): Promise<User | undefined> {
    if (lastUserCache.value?.uid === id) return lastUserCache.value
    
    const doc = await UserDB.getUserById(id)
    if (!doc) return undefined
    lastUserCache.value = User.fromDoc(id, doc)
    return lastUserCache.value
  }
  
  async function getUserByUsername(username: string): Promise<User | undefined> {
    if (lastUserCache.value?.username === username) {
      return lastUserCache.value
    }
    
    const id = await UserDB.getId(username)
    if (!id) return undefined
    const doc = await UserDB.getUserById(id)
    if (!doc) return undefined
    lastUserCache.value = User.fromDoc(id, doc)
    return lastUserCache.value
  }
  
  return { getUserById, getUserByUsername }
})
