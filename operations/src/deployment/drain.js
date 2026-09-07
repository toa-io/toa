import { setTimeout as sleep } from 'node:timers/promises'

/**
 * Waits until no pod of the application is still terminating. `helm --wait` answers once the
 * replacements are ready, while the replicas they replace are still draining, and a request
 * made then may land on either.
 *
 * @param {toa.operations.Process} process
 * @param {toa.deployment.installation.Options} options
 * @returns {Promise<void>}
 */
export async function drain(process, options) {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT
  const deadline = Date.now() + duration(timeout)
  const args = ['get', 'pods', '-o', 'json']

  if (options.namespace !== undefined) args.push('-n', options.namespace)

  let announced = false

  for (;;) {
    const output = await process.execute('kubectl', args, { silently: true })
    const pods = JSON.parse(output).items.filter(terminating)

    if (pods.length === 0) return

    if (Date.now() >= deadline)
      throw new Error(`${pods.length} replaced pod(s) still terminating after ${timeout}`)

    if (!announced) {
      console.log(`Waiting for ${pods.length} replaced pod(s) to terminate`)
      announced = true
    }

    await sleep(INTERVAL)
  }
}

/**
 * A pod of the application on its way out. The chart labels every pod it renders under `toa/`,
 * and nothing else in the namespace is waited for.
 */
const terminating = (pod) =>
  pod.metadata.deletionTimestamp !== undefined &&
  Object.keys(pod.metadata.labels ?? {}).some((label) => label.startsWith('toa/'))

/**
 * A helm duration, `12m` or `1h30m` or `90s`, in milliseconds.
 *
 * @param {string} value
 * @returns {number}
 */
export function duration(value) {
  const matches = value.matchAll(/(\d+)(h|ms|m|s)/g)

  let total = 0

  for (const [, amount, unit] of matches) total += Number(amount) * UNITS[unit]

  if (total === 0) throw new Error(`'${value}' is not a duration`)

  return total
}

const UNITS = { h: 3_600_000, m: 60_000, s: 1_000, ms: 1 }

/** helm's own default for `--timeout` */
const DEFAULT_TIMEOUT = '5m'

const INTERVAL = 3_000
