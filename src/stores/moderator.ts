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
import type { ModerationDoc } from '@/firebase/db/schema'

export type Report = {
  reporterUsername: string
  reasonText: string
  time: Date
}
export type UserReports = {
  userId: string
  // More info about the user
  reports: Report[]
}
export type VariantReports = {
  variantId: string
  // More info about the variant
  reports: Report[]
}

export const useModeratorStore = defineStore('moderator', () => {
  
  const selectedReportIndexes = ref<Set<number>>(new Set())
  const userReports = ref<UserReports[]>([])
  const variantReports = ref<VariantReports[]>([])
  
  async function refreshReports(): Promise<void> {
    const [userModDocs, variantModDocs] = await Promise.all([
      UserDB.getModerationReports(),
      VariantDB.getModerationReports(),
    ])
    
    userReports.value = userModDocs.map(([userId, doc]) => {
      return {
        userId,
        // TODO: Get more info about the user
        reports: extractReports(doc),
      }
    })
    
    variantReports.value = variantModDocs.map(([variantId, doc]) => {
      return {
        variantId,
        // TODO: Get more info about the variant
        reports: extractReports(doc),
      }
    })
  }
  
  function extractReports(doc?: ModerationDoc): Report[] {
    if (!doc) return []
    return doc.reportsSummary.split('\n').map(line => {
      const [reporterUsername, reasonText, time] = line.split('\t')
      const timestamp = parseInt(time)
      return { reporterUsername, reasonText, time: new Date(timestamp) }
    })
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
  
  async function discardUserReport(userId: string): Promise<void> {
    await modDiscardUserReport({ userId, reportIndexes: Array.from(selectedReportIndexes.value) })
  }
  
  async function discardVariantReport(variantId: string): Promise<void> {
    await modDiscardVariantReport({ variantId, reportIndexes: Array.from(selectedReportIndexes.value) })
  }
  
  return {
    selectedReportIndexes, userReports, variantReports,
    refreshReports,
    deleteVariant, banUser, wipeUser, discardUserReport, discardVariantReport,
  }
})
