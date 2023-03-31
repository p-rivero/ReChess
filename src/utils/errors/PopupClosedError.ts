
// Used to signal that the user closed a popup, so just cancel the operation

export class PopupClosedError extends Error {
  constructor() {
    super('User closed the popup')
  }
}
