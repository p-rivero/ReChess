import { defineStore } from 'pinia'
import { UserDB } from '@/firebase/db'
import type { UserDoc } from '@/firebase/db/schema'

export class User {
  public username: string
  public displayName?: string
  public about?: string
  public profileImg?: string
  
  constructor(username: string, displayName?: string, about?: string, profileImg?: string) {
    this.username = username
    this.displayName = displayName
    this.about = about
    this.profileImg = profileImg
  }
  
  static fromDoc(doc: UserDoc): User {
    return new User(doc.SERVER.username, doc.name, doc.about, doc.profileImg)
  }
  
  public get name() {
    return this.displayName || `@${this.username}`
  }
}

export const useUserStore = defineStore('user', () => {
  
  async function getUserById(id: string): Promise<User | undefined> {
    const doc = await UserDB.getUserById(id)
    if (!doc) return undefined
    return User.fromDoc(doc)
  }
  
  async function getUserByUsername(username: string): Promise<User | undefined> {
    const doc = await UserDB.getUserByUsername(username)
    if (!doc) return undefined
    return User.fromDoc(doc)
  }
  
  return { getUserById, getUserByUsername }
})
