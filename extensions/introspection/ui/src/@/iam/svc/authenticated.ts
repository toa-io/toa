import { iam, method, type Method } from './store'
import type { Echo } from './net'

/**
 * Set current account and authentication method.
 *
 * @param echo - The authenticated account echo (`201` on first registration, else `200`).
 * @param channel - The auth channel the user authenticated through.
 */
export function authenticated(echo: Echo | Error, channel: Method): Echo | Error {
  if (echo instanceof Error) return echo

  iam(echo)
  method.set(channel)

  return echo
}
