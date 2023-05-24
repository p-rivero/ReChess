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
  credential: admin.credential.cert(serviceAccount),
})

const username = process.argv[2]
let id
try {
  id = await getIdFromUsername(username)
} catch (err) {
  setTerminalColor('red')
  console.error(err.message)
  setTerminalColor('white')
  process.exit(1)
}
console.info(`User ID: ${id}`)

if (await isModerator(id)) {
  setTerminalColor('red')
  console.info(`The user ${username} is a moderator. Press 'y' to REMOVE moderator status.`)
} else {
  setTerminalColor('green')
  console.info(`This will GIVE ${username} moderator status. Press 'y' to confirm.`)
}
setTerminalColor('white')
console.info('(press anything else to cancel)\n')

onKeyPress(
  'y',
  async () => {
    process.stdout.write('Updating...')
    const isMod = await toggleModerator(id)
    setTerminalColor('yellow')
    console.info(`\rModerator status for ${username} is now`, isMod ? 'ENABLED' : 'DISABLED')
    setTerminalColor('white')
    console.info('Refresh the user token by visiting https://rechess.org/?refresh-auth=true')
    process.exit(0)
  },
  () => {
    console.info('Operation cancelled, no changes made.')
    process.exit(1)
  }
)



async function getIdFromUsername(username) {
  const db = admin.firestore()
  const userRef = db.collection('usernames').doc(username)
  const usernameDoc = await userRef.get()
  if (!usernameDoc.exists) {
    throw new Error(`User ${username} does not exist`)
  }
  return usernameDoc.data().userId
}

async function isModerator(id) {
  const auth = admin.auth()
  const user = await auth.getUser(id)
  return user.customClaims?.moderator === true
}

async function toggleModerator(id) {
  const auth = admin.auth()
  const user = await auth.getUser(id)
  const newClaims = user.customClaims ?? {}
  newClaims.moderator = !newClaims.moderator
  await auth.setCustomUserClaims(id, newClaims)
  return newClaims.moderator
}

function onKeyPress(expectedKey, keyCallback, cancelCallback) {
  process.stdin.setRawMode(true)
  process.stdin.resume()
  process.stdin.setEncoding('utf8')
  process.stdin.once('data', function(key) {
    if (key === expectedKey) {
      keyCallback()
    } else {
      cancelCallback()
    }
  })
}

function setTerminalColor(color) {
  const COLOR_CODES = {
    black: '\x1b[0;30m',
    red: '\x1b[0;31m',
    green: '\x1b[0;32m',
    yellow: '\x1b[0;33m',
    blue: '\x1b[0;34m',
    magenta: '\x1b[0;35m',
    cyan: '\x1b[0;36m',
    white: '\x1b[0;37m',
  }
  process.stdout.write(COLOR_CODES[color])
}
