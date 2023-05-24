import { type Ref, nextTick } from 'vue'
import type PopupMessage from '@/components/PopupMsg/PopupMessage.vue'

let messagePopup: Ref<InstanceType<typeof PopupMessage> | undefined> | null = null

export function setMessagePopup(popup: Ref<InstanceType<typeof PopupMessage> | undefined>) {
  messagePopup = popup
}

/**
 * Displays a popup message / warning to the user.
 * @param {string} title The title of the popup
 * @param {string} message The message to display, in **Markdown** format
 * @param {'ok' | 'ok-cancel' | 'yes-no'} buttons The text of the buttons to display
 * @param {() => void} accept Callback for when the user accepts the popup (OK, Yes)
 * @param {() => void} cancel Callback for when the user cancels the popup (Cancel, No), or closes the popup (X or outside the popup)
 */
export function showPopup(title: string, message: string, buttons: 'ok' | 'ok-cancel' | 'yes-no', accept?: () => void, cancel?: () => void) {
  nextTick(() => messagePopup?.value?.show(false, title, message, buttons, accept, cancel))
}

/**
 * Displays a popup message / warning to the user that cannot be ignored by clicking outside the popup.
 * The only way to close the popup is to click on the cancel button or the X button.
 * See `showPopup` for parameters.
 */
export function showPopupImportant(title: string, message: string, buttons: 'ok' | 'ok-cancel' | 'yes-no', accept?: () => void, cancel?: () => void) {
  nextTick(() => messagePopup?.value?.show(true, title, message, buttons, accept, cancel))
}
