import net from 'net'

export async function assertEmulatorsRunning(): Promise<void> {
  await Promise.all([
    assertEmulatorRunning('Firestore', 8080, true),
    assertEmulatorRunning('Auth', 9099, true),
    assertEmulatorRunning('Storage', 9199, true),
    assertEmulatorRunning('Functions', 5001, false),
  ])
}

export async function assertEmulatorRunning(name: string, port: number, mustRun: boolean): Promise<void> {
  const running = await isPortTaken(port)
  if (running && !mustRun) throw new Error(`Please STOP the ${name} emulator before running the tests.`)
  if (!running && mustRun) throw new Error(`Please START the ${name} emulator before running the tests.`)
}

function isPortTaken(port: number): Promise<boolean> {
  let numTries = 0
  return new Promise((resolve, reject) => {
    const tester = net.createServer()
      .on('error', (err: {code: string}) => {
        if (err.code !== 'EADDRINUSE') return reject(err)
        // Connecting could fail if another test is checking the port at the same time
        // If connecting fails 3 times, the port is taken
        if (numTries++ > 3) return resolve(true)
        tester.listen(port)
      })
      .once('listening', () => {
        tester.once('close', () => resolve(false)).close()
      })
      .listen(port)
  })
}
