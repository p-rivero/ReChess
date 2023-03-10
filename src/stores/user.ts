import { ref } from 'vue'
import { defineStore } from 'pinia'

export class User {
  constructor(
    public username: string,
    public displayName?: string,
    public about?: string,
    public profileImg?: string,
  ) {}
  
  public get name() {
    return this.displayName || `@${this.username}`
  }
}

export const useUserStore = defineStore('user', () => {
  
  // TODO
  
  return {  }
})
