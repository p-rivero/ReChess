import { defineStore } from 'pinia'
import {
  banUser as modBanUser,
  deleteVariant as modDeleteVariant,
  discardUserReport as modDiscardUserReport,
  discardVariantReport as modDiscardVariantReport,
  wipeUser as modWipeUser,
} from '@/firebase'

export const useModeratorStore = defineStore('moderator', () => {
  
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
    await modDiscardUserReport({ userId })
  }
  
  async function discardVariantReport(variantId: string): Promise<void> {
    await modDiscardVariantReport({ variantId })
  }
  
  return { deleteVariant, banUser, wipeUser, discardUserReport, discardVariantReport }
})
