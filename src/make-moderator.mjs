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
  console.error(err)
  setTerminalColor('white')
  process.exit(1)
}
console.log(`User ID: ${id}`)

if (await isModerator(id)) {
  setTerminalColor('red')
  console.log(`The user ${username} is a moderator. Press 'y' to REMOVE moderator status.`)
} else {
  setTerminalColor('green')
  console.log(`This will GIVE ${username} moderator status. Press 'y' to confirm.`)
}
setTerminalColor('white')
console.log('(press anything else to cancel)\n')

onKeyPress(
  'y',
  async () => {
    const isMod = await toggleModerator(id)
    setTerminalColor('yellow')
    console.log(`Moderator status for ${username} is now`, isMod ? 'ENABLED' : 'DISABLED')
    setTerminalColor('white')
    console.log('Refresh the user token by visiting https://rechess.org/?refresh-auth=true')
    process.exit(0)
  },
  () => {
    console.log('Operation cancelled, no changes made.')
    process.exit(1)
  }
)



async function getIdFromUsername(username) {
  const db = admin.firestore()
  const userRef = db.collection('usernames').doc(username)
  const usernameDoc = await userRef.get()
  if (!usernameDoc.exists) {
    throw `User ${username} does not exist`
  }
  return usernameDoc.data().userId
}

async function isModerator(id) {
  const auth = admin.auth()
  const user = await auth.getUser(id)
  return user.customClaims && user.customClaims.moderator
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
