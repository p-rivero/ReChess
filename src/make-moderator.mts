// Utility to make a user a moderator (or remove moderator status)

// Usage: npm run make-moderator -- <username>
// This will toggle the moderator status of the user

// The script requires the admin-key.json file to be present in the .config directory

import admin from 'firebase-admin'
import serviceAccount from '../.config/admin-key.json' assert { type: 'json' }


if (process.argv.length < 3) {
  console.error('Usage: npm run make-moderator -- <username>')
  process.exit(1)
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
})

const username = process.argv[2]
console.info(`Fetching user @${username}...`)
let user: admin.auth.UserRecord
try {
  user = await fetchUser(username)
} catch (err) {
  if (!(err instanceof Error)) throw err
  printError(err.message)
  process.exit(1)
}

if (await isBanned(user)) {
  printError(`@${username} is banned. Please unban them first.`)
  process.exit(1)
}
if (isModerator(user)) {
  printWithColor('red', `@${username} is a moderator. Press 'y' to REMOVE moderator status.`)
} else {
  printWithColor('green', `This will GIVE @${username} moderator status. Press 'y' to confirm.`)
}
console.info('(press anything else to cancel)\n')

onKeyPress(
  'y',
  async () => {
    process.stdout.write('Updating...')
    const isMod = await toggleModeratorStatus(user)
    printWithColor('yellow', `\rModerator status for @${username} is now ${isMod ? 'ENABLED' : 'DISABLED'}`)
    console.info('Refresh the user token by visiting https://rechess.org/?refresh-auth=true')
    process.exit(0)
  },
  () => {
    console.info('Operation cancelled, no changes made.')
    process.exit(1)
  }
)


// User management

async function fetchUser(username: string) {
  const db = admin.firestore()
  const userRef = db.collection('usernames').doc(username)
  const usernameDoc = await userRef.get()
  const userId = usernameDoc.data()?.userId
  if (!userId) {
    throw new Error(`User @${username} does not exist`)
  }
  const user = await admin.auth().getUser(userId)
  return user
}

async function isBanned(user: admin.auth.UserRecord) {
  const userDoc = await admin.firestore().collection('users').doc(user.uid).get()
  return userDoc.data()?.banned === true
}

function isModerator(user: admin.auth.UserRecord) {
  return user.customClaims?.moderator === true
}

async function toggleModeratorStatus(user: admin.auth.UserRecord) {
  const newClaims = user.customClaims ?? {}
  newClaims.moderator = !newClaims.moderator
  await admin.auth().setCustomUserClaims(user.uid, newClaims)
  return newClaims.moderator
}


// Terminal UI

type KeyCallback = () => Promise<void> | void
function onKeyPress(expectedKey: string, keyCallback: KeyCallback, cancelCallback: KeyCallback) {
  process.stdin.setRawMode(true)
  process.stdin.resume()
  process.stdin.setEncoding('utf8')
  process.stdin.once('data', async (key) => {
    if (key.toString() === expectedKey) {
      await keyCallback()
    } else {
      await cancelCallback()
    }
  })
}

type Color = 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white'
function printWithColor(color: Color, text: string) {
  setTerminalColor(color)
  console.info(text)
  setTerminalColor('white')
}
function printError(text: string) {
  setTerminalColor('red')
  console.error(text)
  setTerminalColor('white')
}

function setTerminalColor(color: Color) {
  const COLOR_CODES = {
    black: '\x1b[0;30m',
    red: '\x1b[0;31m',
    green: '\x1b[0;32m',
    yellow: '\x1b[0;33m',
    blue: '\x1b[0;34m',
    magenta: '\x1b[0;35m',
    cyan: '\x1b[0;36m',
    white: '\x1b[0;39m',
  }
  process.stdout.write(COLOR_CODES[color])
}
