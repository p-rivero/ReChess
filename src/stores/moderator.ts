import { type User, useUserStore } from './user'
import { UserDB, VariantDB } from '@/firebase/db'
import { defineStore } from 'pinia'
import {
  banUser as modBanUser,
  deleteVariant as modDeleteVariant,
  discardUserReport as modDiscardUserReport,
  discardVariantReport as modDiscardVariantReport,
  wipeUser as modWipeUser,
} from '@/firebase'
import { ref } from 'vue'
import { useVariantStore } from './variant'
import type { ModerationDoc } from '@/firebase/db/schema'
import type { PublishedVariant } from '@/protochess/types'

export type Report = {
  reporterUsername: string
  reasonText: string
  time: Date
}
export type UserReports = {
  reportedUser: User
  reports: Report[]
}
export type VariantReports = {
  reportedVariant: PublishedVariant
  reports: Report[]
}

export const useModeratorStore = defineStore('moderator', () => {
  
  const userStore = useUserStore()
  const variantStore = useVariantStore()
  
  const userReports = ref<UserReports[]>([])
  const variantReports = ref<VariantReports[]>([])
  
  async function refreshUserReports(): Promise<void> {
    userReports.value = []
    const userModDocs = await UserDB.getModerationReports()
    
    // Fetch all reported users at the same time
    userReports.value = await Promise.all(userModDocs.map(async ([userId, doc]) => {
      const user = await userStore.getUserById(userId)
      if (!user) throw new Error(`Reported user ${userId} not found`)
      return {
        reportedUser: user,
        reports: extractReports(doc),
      }
    }))
  }
  
  async function refreshVariantReports(): Promise<void> {
    variantReports.value = []
    const variantModDocs = await VariantDB.getModerationReports()
    
    // Fetch all reported variants at the same time
    variantReports.value = await Promise.all(variantModDocs.map(async ([variantId, doc]) => {
      const variant = await variantStore.getVariant(variantId)
      if (!variant) throw new Error(`Reported variant ${variantId} not found`)
      return {
        reportedVariant: variant,
        reports: extractReports(doc),
      }
    }))
  }
  
  function extractReports(doc?: ModerationDoc): Report[] {
    if (!doc) return []
    const reports = doc.reportsSummary
      .split('\n')
      .filter(line => line.length > 0)
      .map(line => {
        const [reporterUsername, reasonText, time] = line.split('\t')
        const timestamp = parseInt(time)
        return { reporterUsername, reasonText, time: new Date(timestamp) }
      })
    if (reports.length !== doc.numReports) {
      throw new Error(`Number of reports (${reports.length}) does not match numReports (${doc.numReports})`)
    }
    return reports
  }
  
  async function deleteVariant(variantId: string): Promise<void> {
    await modDeleteVariant({ variantId })
  }
  
  async function banUser(userId: string): Promise<void> {
    await modBanUser({ userId })
  }
  
  async function wipeUser(userId: string): Promise<void> {
    await modWipeUser({ userId })
  }
  
  async function discardUserReports(userId: string, indexes: Set<number>): Promise<void> {
    // Update in backend
    await modDiscardUserReport({ userId, reportIndexes: Array.from(indexes) })
    // Update the local store
    const reports = userReports.value
    const i = reports.findIndex(userReports => userReports.reportedUser.uid === userId)
    reports[i].reports = reports[i].reports.filter((_, i) => !indexes.has(i))
    if (reports[i].reports.length === 0) {
      reports.splice(i, 1)
    }
    userReports.value = reports
  }
  
  async function discardVariantReports(variantId: string, indexes: Set<number>): Promise<void> {
    // Update in backend
    await modDiscardVariantReport({ variantId, reportIndexes: Array.from(indexes) })
    // Update the local store
    const reports = variantReports.value
    const i = reports.findIndex(variantReports => variantReports.reportedVariant.uid === variantId)
    reports[i].reports = reports[i].reports.filter((_, i) => !indexes.has(i))
    if (reports[i].reports.length === 0) {
      reports.splice(i, 1)
    }
    variantReports.value = reports
  }
  
  return {
    userReports, variantReports,
    refreshUserReports, refreshVariantReports,
    deleteVariant, banUser, wipeUser, discardUserReports, discardVariantReports,
  }
})
