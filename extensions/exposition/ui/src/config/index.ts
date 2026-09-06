import { version as ver } from '$app/environment'

export const meta = {
  title: 'Discovery',
  description: 'What a Toa application serves',
} as const

export const navigation = {
  /** There is one screen, and it is the way in. */
  entry: '/',
} as const

/**
 * Where the API is: wherever this page came from.
 *
 * The gateway serves this page itself, so the two are one origin — in a deployment and in
 * a checkout alike. The introspection and configuration consoles are served on ports of
 * their own and each has to name the gateway's; this one has nothing to name.
 */
export const origin = typeof window === 'undefined' ? '' : window.location.origin

export const sleep: [number, number] | undefined = (() => {
  const sleep = import.meta.env.VITE_DEV_SLEEP

  if (sleep === undefined) return

  const match = sleep.match(/^(?<min>\d+)-(?<max>\d+)$/)

  if (match === null || match.groups === undefined)
    throw new Error(`Invalid sleep value: ${sleep}`)

  return [Number.parseInt(match.groups.min), Number.parseInt(match.groups.max)]
})()

export const GOOGLE_CLIENT_ID = import.meta.env.PUBLIC_GOOGLE_CLIENT_ID
export const APPLE_CLIENT_ID = import.meta.env.PUBLIC_APPLE_CLIENT_ID

const MAJOR_VERSION = '1'

export const version = (() => {
  const date = new Date(Number.parseInt(ver))
  const year = date.getFullYear()
  const startOfYear = new Date(year, 0, 1).getTime()
  const startNextYear = new Date(year + 1, 0, 1).getTime()
  const fraction = (date.getTime() - startOfYear) / (startNextYear - startOfYear)

  return `${MAJOR_VERSION}.${(year + fraction).toFixed(4)}`
})()
