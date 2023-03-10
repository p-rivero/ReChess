
// Used to signal that there is no user with the given email, so the register form should be shown

export class UserNotFoundError extends Error {
  constructor() {
    super('User not found');
  }
}
