import { origin, type RequestOptions } from '@/net'
import type { Echo } from './Echo'

const echo = origin.resource<Echo>('/accounts/echo/')

export async function get(authorization?: string): Promise<Echo | Error> {
  const options: RequestOptions = { method: 'GET' }

  if (authorization !== undefined) {
    options.headers = { authorization }
    options.credentials = 'include'
  }

  return echo.json(options)
}
