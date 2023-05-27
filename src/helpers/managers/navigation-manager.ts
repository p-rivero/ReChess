import { router } from '@/router'
import { showPopup } from './popup-manager'
import type { User } from '@/stores/user'

const ERROR_CODES = {
  400: '400 Bad Request 🤔',
  401: '401 Unauthorized 🔐',
  403: '403 Forbidden ⛔',
  404: '404 Not Found 🤷',
  500: '500 Internal Server Error 🛠️',
  503: '503 Service Unavailable 🚧',
}
export type ErrorCode = keyof typeof ERROR_CODES

export function returnHome(error: ErrorCode, reason: string) {
  console.info('Redirecting to home page from:', window.location.pathname)
  if (reason === 'This URL seems to be incorrect.') {
    throw new Error('User is not logged in')
  }
  const popupText = reason + '\n\nYou were redirected to the home page.'
  showPopup(ERROR_CODES[error], popupText, 'ok')
  router.replace({ name: 'home' })
}

export type UserStore = {
  getUserById: (id: string) => Promise<User | undefined>
}
export async function goToProfile(userStore: UserStore, userId: string, newTab = false) {
  // Get the username of the creator
  const user = await userStore.getUserById(userId)
  if (!user) {
    throw new Error('Could not find user with id ' + userId)
  }
  if (newTab) {
    const location = router.resolve({ name: 'user-profile', params: { username: user.username } })
    window.open(location.href, '_blank')
  } else {
    router.push({ name: 'user-profile', params: { username: user.username } })
  }
}
