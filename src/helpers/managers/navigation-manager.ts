import { showPopup } from './popup-manager'
import type { Router } from 'vue-router'

const ERROR_CODES = {
  400: '400 Bad Request 🤔',
  401: '401 Unauthorized 🔐',
  403: '403 Forbidden ⛔',
  404: '404 Not Found 🤷',
  500: '500 Internal Server Error 🛠️',
  503: '503 Service Unavailable 🚧',
}
export type ErrorCode = keyof typeof ERROR_CODES

export function returnHome(router: Router, error: ErrorCode, reason: string) {
  const popupText = reason + '\n\nYou were redirected to the home page.'
  showPopup(ERROR_CODES[error], popupText, 'ok')
  router.replace({ name: 'home' })
}
