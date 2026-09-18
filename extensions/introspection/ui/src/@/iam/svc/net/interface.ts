import { origin, type RequestOptions } from '@/net'
import type { Echo } from './Echo'

/** Exposition's authentication echo: the identity the credentials resolve to, and its roles. */
const echo = origin.resource<Echo>('/identity/')

export async function get(authorization?: string): Promise<Echo | Error> {
  const options: RequestOptions = { method: 'GET' }

  if (authorization !== undefined) {
    options.headers = { authorization }
    options.credentials = 'include'
  }

  return echo.json(options)
}
