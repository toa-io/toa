import { version as ver } from '$app/environment'

export const meta = {
  title: 'Introspection',
  description: 'The map of a Toa application',
} as const

export const navigation = {
  /** Entry point for authenticated users. */
  entry: '/',
} as const

/** Exposition's HTTP port. It is a constant of the runtime; this bundle cannot import it. */
const GATEWAY_PORT = 8000

/**
 * Where the API is.
 *
 * The page is published on the hosts Exposition serves, so the gateway is our own
 * origin — that is what the context's `ingress` section is required to say. Locally
 * there is no ingress and the two are separate ports: the explorer serves this page,
 * the gateway answers next door.
 */
export const origin = (() => {
  // the build renders an empty shell in Node, where nothing requests anything
  if (typeof window === 'undefined') return ''

  const { protocol, hostname, origin } = window.location

  return local(hostname) ? `${protocol}//${hostname}:${GATEWAY_PORT}` : origin
})()

export const sleep: [number, number] | undefined = (() => {
  const sleep = import.meta.env.VITE_DEV_SLEEP

  if (sleep === undefined) return

  const match = sleep.match(/^(?<min>\d+)-(?<max>\d+)$/)

  if (match === null || match.groups === undefined)
    throw new Error(`Invalid sleep value: ${sleep}`)

  return [Number.parseInt(match.groups.min), Number.parseInt(match.groups.max)]
})()

function local(hostname: string) {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('172.16.') ||
    hostname.startsWith('10.')
  )
}

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
