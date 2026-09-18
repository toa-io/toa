import { origin } from '@/net'
import type { CreationResponse, RequestResponse } from '@/passkeys/svc/net'

const passkeys = origin.resource('/identity/passkeys/')

export async function post(
  a: string | RequestResponse,
  body?: CreationResponse,
): Promise<unknown | Error> {
  if (typeof a === 'string')
    return await passkeys.json(a, { method: 'POST', body, credentials: 'include' })
  else return await passkeys.json({ method: 'POST', body: a })
}
