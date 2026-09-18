import * as passkeys from '@/passkeys'
import * as origin from '../net'
import { authenticated } from '../authenticated'
import { challenge } from '../store'

export async function create(
  name: string,
  identity?: string,
): Promise<origin.Echo | Error> {
  const response = await passkeys.create(name, identity)

  if (response instanceof Error) {
    console.error('Credential creation failed', response)

    return response
  }

  const created = await origin.passkeys.post(response.identity, response.key)

  if (created instanceof Error) {
    console.error('Credential registration failed', created)

    return created
  }

  const credentials = challenge.extract()

  if (credentials === null) return new Error('Unauthenticated')

  return authenticated(await origin.get(credentials), 'passkey')
}
