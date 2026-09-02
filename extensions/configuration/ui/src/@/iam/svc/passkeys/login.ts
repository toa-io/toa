import { request } from '@/passkeys'
import { passkeys } from '../net'
import { authenticated } from '../authenticated'
import type { Echo } from '../net'

export async function login(id?: string): Promise<Echo | Error> {
  const response = await request(id)

  if (response instanceof Error) {
    console.error('Credential request failed', response)

    return response
  }

  const echo = await passkeys.post(response)

  if (echo instanceof Error)
    console.error('Credential verification failed', echo)

  return authenticated(echo, 'passkey')
}
