import { type Ref, nextTick } from 'vue'
import type { PopupButtons, PopupCallback, default as PopupMessage } from '@/components/popup-message/PopupMessage.vue'

let messagePopup: Ref<InstanceType<typeof PopupMessage> | undefined> | null = null

export function setMessagePopup(popup: Ref<InstanceType<typeof PopupMessage> | undefined>) {
  messagePopup = popup
}

/**
 * Displays a popup message / warning to the user.
 * @param {string} title The title of the popup
 * @param {string} message The message to display, in **Markdown** format
 * @param {PopupButtons} buttons The text of the buttons to display
 * @param {PopupCallback} accept Callback for when the user accepts the popup (OK, Yes)
 * @param {PopupCallback} cancel Callback for when the user cancels the popup (Cancel, No), or closes the popup (X or outside the popup)
 */
export function showPopup(title: string, message: string, buttons: PopupButtons, accept?: PopupCallback, cancel?: PopupCallback) {
  nextTick(() => messagePopup?.value?.show(false, title, message, buttons, accept, cancel))
}

/**
 * Displays a popup message / warning to the user that cannot be ignored by clicking outside the popup.
 * The only way to close the popup is to click on the cancel button or the X button.
 * See `showPopup` for parameters.
 */
export function showPopupImportant(title: string, message: string, buttons: PopupButtons, accept?: PopupCallback, cancel?: PopupCallback) {
  nextTick(() => messagePopup?.value?.show(true, title, message, buttons, accept, cancel))
}
