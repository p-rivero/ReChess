import type { Ref } from 'vue'
import { RechessError } from './RechessError'

export interface ErrorHandlerText {
  show: (message: string) => void
}
export interface ErrorHandlerUser {
  refresh: () => string|undefined
  priority: number
}

export class ErrorMessageHandler {
  messageUsers: ErrorHandlerUser[] = []
  messageText: ErrorHandlerText[] = []
  hasErrorRef: Ref<boolean>
  currentPriority = NaN
  
  // The passed ref will be set to true when there is an error
  // This allows disabling buttons and other UI elements
  constructor(hasErrorRef: Ref<boolean>) {
    this.hasErrorRef = hasErrorRef
  }

  
  // Add the error message component
  registerText(errorMessageRef: ErrorHandlerText) {
    this.messageText.push(errorMessageRef)
  }
  
  // Add a new user of the error message
  register(user: ErrorHandlerUser) {
    this.messageUsers.push(user)
    // We could return an id or interface here, but for now we don't need it
  }

  // Show an error message
  show(message: string, priority: number) {
    if (this.currentPriority > priority) return
    this.hasErrorRef.value = true
    this.currentPriority = priority
    this.messageText.forEach((messageText) => {
      messageText.show(message)
    })
  }
  
  // Show an exception
  showException(exception: unknown, priority: number = 0) {
    if (exception instanceof RechessError) {
      this.show(exception.localizedMessage, priority)
    } else if (exception instanceof Error) {
      this.show(exception.message, priority)
    } else {
      this.show('Unknown error', priority)
      console.error('Non-error exception was thrown', exception)
    }
  }
  
  // Clear the error message, poll all users for a new error message
  clear() {
    this.currentPriority = NaN
    for (const user of this.messageUsers) {
      const refreshResult = user.refresh()
      if (refreshResult) {
        this.show(refreshResult, user.priority)
        return
      }
    }
    // All users are happy, no error
    this.hasErrorRef.value = false
  }
}
