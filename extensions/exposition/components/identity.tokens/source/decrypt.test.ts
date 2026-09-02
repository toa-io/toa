import { generate } from 'randomstring'
import { V3 } from 'paseto'
import { Effect as Encrypt } from './encrypt.js'
import { Computation as Decrypt } from './decrypt.js'
import { type Configuration, type Context, type Identity } from './lib/index.js'
import type { Secret } from '@toa.io/types'

let configuration: Configuration
let context: Context
let encrypt: Encrypt
let decrypt: Decrypt

const remote = { identity: { keys: { observe: jest.fn(async () => null) } } }
const authority = generate()

beforeEach(() => {
  configuration = {
    keys: [
      { id: 'key0', key: secret('sTxL6qVOadKkUJwh3FveU53XgTEo3Sdfg7k2FfiIKfs') },
      // keys are secrets, and a secret is an object
      { id: 'key1', key: secret('5I0iSKw3yfBkQ4AXfA8eR-tWR0Q1dpn4x3bPrPzHkP0') },
      { id: 'legacy0', key: secret('k3.local.m28p8SrbS467t-2IUjQuSOqmjvi24TbXhyjAW_dOrog'), format: 'paseto' },
      { id: 'legacy1', key: secret('k3.local.-498jfWenrZH-Dqw3-zQJih_hKzDgBgUMfe37OCqSOA'), format: 'paseto' }
    ],
    lifetime: 1000,
    refresh: 500,
    cache: {
      max: 1024,
      ttl: 600
    }
  }

  context = { configuration, remote, logs: { debug: () => undefined } } as unknown as Context

  encrypt = new Encrypt()
  encrypt.mount(context)

  decrypt = new Decrypt()
  decrypt.mount(context)
})

it('should decrypt', async () => {
  const identity: Identity = { id: generate(), roles: [] }
  const lifetime = 100

  const reply = await encrypt.execute({ authority, identity, lifetime })

  if (reply instanceof Error)
    throw reply

  const decrypted = await decrypt.execute(reply)

  expect(decrypted).toMatchObject({ iss: authority, identity, refresh: false })
})

it('should decrypt with key1', async () => {
  const k1context = {
    configuration: {
      keys: [configuration.keys[1]]
    }
  } as unknown as Context

  encrypt = new Encrypt()
  encrypt.mount(k1context)

  const identity: Identity = { id: generate(), roles: [] }
  const lifetime = 100

  const encrypted = await encrypt.execute({ authority, identity, lifetime })

  if (encrypted instanceof Error)
    throw encrypted

  const decrypted = await decrypt.execute(encrypted)

  expect(decrypted).toMatchObject({ identity, refresh: true })
})

it('should decrypt legacy PASETO and require refresh', async () => {
  const identity: Identity = { id: generate(), roles: [] }

  const token = await V3.encrypt({ iss: authority, identity }, configuration.keys[2].key.unwrap(), {
    footer: { kid: 'legacy0' }
  })

  await expect(decrypt.execute(token)).resolves.toMatchObject({
    iss: authority,
    identity,
    refresh: true
  })
})

it('should separate JWE and PASETO keys with the same id by format', async () => {
  configuration.keys[2].id = 'key0'

  decrypt = new Decrypt()
  decrypt.mount(context)

  const identity: Identity = { id: generate(), roles: [] }

  const token = await V3.encrypt({ iss: authority, identity }, configuration.keys[2].key.unwrap(), {
    footer: { kid: 'key0' }
  })

  await expect(decrypt.execute(token)).resolves.toMatchObject({ identity, refresh: true })
})

it('should reject a tampered JWE', async () => {
  const token = await encrypt.execute({
    authority,
    identity: { id: generate(), roles: [] }
  })

  if (token instanceof Error)
    throw token

  const parts = token.split('.')

  parts[3] = (parts[3].startsWith('A') ? 'B' : 'A') + parts[3].slice(1)

  const tampered = parts.join('.')

  await expect(decrypt.execute(tampered)).resolves.toMatchObject({ code: 'INVALID_TOKEN' })
})

it('should reject JWE with an unknown key', async () => {
  const token = await encrypt.execute({
    authority,
    identity: { id: generate(), roles: [] },
    key: { id: 'missing', key: configuration.keys[0].key.unwrap(), label: 'missing' }
  })

  if (token instanceof Error)
    throw token

  await expect(decrypt.execute(token)).resolves.toMatchObject({ code: 'INVALID_KEY' })
})

function secret (value: string): Secret {
  return { unwrap: () => value }
}
