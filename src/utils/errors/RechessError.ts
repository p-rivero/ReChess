
export class RechessError extends Error {
  public readonly code: ErrorToken
  static locale: ErrorLocale = 'en'
  
  constructor(code: ErrorToken) {
    super(`RechessError: ${code}`)
    this.code = code
  }
  
  static setLocale(locale: ErrorLocale) {
    this.locale = locale
  }
  
  get localizedMessage() {
    return LOCALES[RechessError.locale][this.code]
  }
}


const ERROR_TOKENS = [
  'EMAIL_ALREADY_IN_USE',
  'CANNOT_CREATE_USER',
  'WRONG_PASSWORD',
  'WRONG_PASSWORD_PROVIDER',
] as const

export type ErrorToken = typeof ERROR_TOKENS[number]

// Add here other locales

export type ErrorLocale = 'en'

const LOCALES: Record<ErrorLocale, Record<ErrorToken, string>> = {
  'en': {
    'EMAIL_ALREADY_IN_USE': 'This email is already in use, please use a different one',
    'CANNOT_CREATE_USER': 'Could not create the user profile, try again later',
    'WRONG_PASSWORD': 'The password is incorrect',
    'WRONG_PASSWORD_PROVIDER': 'This account is linked to a Google or GitHub account, please use the buttons below to sign in'
  },
}
