/**
 * Fails the process the way `FATAL` names, once it is up: an exception nobody catches, a
 * rejection nobody handles, or a start that does not complete.
 */
export function ready() {
  switch (process.env.FATAL) {
    case 'exception':
      setImmediate(() => {
        throw new Error('Fatal as asked')
      })

      break
    case 'rejection':
      void Promise.reject(new Error('Fatal as asked'))

      break
    case 'boot':
      throw new Error('Fatal at boot as asked')
  }
}
