import { request } from '@/passkeys'
import { challenge } from '../store'
import * as net from '../net'
import { authenticated } from '../authenticated'
import type { Echo } from '../net'

export async function login(id?: string): Promise<Echo | Error> {
  const response = await request(id)

  if (response instanceof Error) {
    console.error('Credential request failed', response)

    return response
  }

  const used = await net.passkeys.post(response)

  if (used instanceof Error) {
    console.error('Credential verification failed', used)

    return used
  }

  const credentials = challenge.extract()

  if (credentials === null) return new Error('Unauthenticated')

  return authenticated(await net.get(credentials), 'passkey')
}
