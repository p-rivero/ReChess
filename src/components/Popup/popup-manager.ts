import type { Ref } from 'vue'
import type PopupMessage from '@/components/Popup/PopupMessage.vue'

let messagePopup: Ref<InstanceType<typeof PopupMessage> | undefined> | null = null

export function setMessagePopup(popup: Ref<InstanceType<typeof PopupMessage> | undefined>) {
  messagePopup = popup
}

export function showPopup(title: string, message: string, buttons: 'ok' | 'ok-cancel' | 'yes-no', accept?: () => void, cancel?: () => void) {
  if (!messagePopup) throw new Error('Message popup not set')
  if (!messagePopup.value) throw new Error('Message popup not initialized')
  messagePopup.value.show(title, message, buttons, accept, cancel)
}
