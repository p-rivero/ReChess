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

export const useModeratorStore = defineStore('moderator', () => {
  
  const selectedReportIndexes = ref<Set<number>>(new Set())
  
  async function getUserReports(userId: string): Promise<Report[]> {
    const modDoc = await UserDB.getUserReports(userId)
    return extractReports(modDoc)
  }
  async function getVariantReports(variantId: string): Promise<Report[]> {
    const modDoc = await VariantDB.getVariantReports(variantId)
    return extractReports(modDoc)
  }
  function extractReports(doc?: ModerationDoc) {
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
    selectedIndexes: selectedReportIndexes,
    getUserReports, getVariantReports,
    deleteVariant, banUser, wipeUser, discardUserReport, discardVariantReport,
  }
})
