import { it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { generate } from 'randomstring'
import { timeout } from '@toa.io/generic'
import { Effect as Encrypt } from './encrypt.js'
import { Computation as Decrypt } from './decrypt.js'
import { type Context, type Identity } from './lib/index.js'
import type { Secret } from '@toa.io/extensions.configuration'

let encrypt: Encrypt
let decrypt: Decrypt

const context: Context = {
  remote: { identity: { keys: null } },
  logs: { debug: () => undefined }
} as unknown as Context

const authority = generate()

beforeEach(() => {
  context.configuration = {
    keys: [
      { id: 'key0', key: secret('sTxL6qVOadKkUJwh3FveU53XgTEo3Sdfg7k2FfiIKfs') },
      { id: 'legacy0', key: secret('k3.local.m28p8SrbS467t-2IUjQuSOqmjvi24TbXhyjAW_dOrog'), format: 'paseto' }
    ],
    lifetime: 1,
    refresh: 2,
    cache: {
      max: 1024,
      ttl: 3
    }
  }

  encrypt = new Encrypt()
  encrypt.mount(context)

  decrypt = new Decrypt()
  decrypt.mount(context)
})

it('should use the first encryption key as active and expose its id as kid', async () => {
  context.configuration.keys.unshift({
    id: 'legacy-first',
    key: secret('k3.local.m28p8SrbS467t-2IUjQuSOqmjvi24TbXhyjAW_dOrog'),
    format: 'paseto'
  })
  context.configuration.keys.push({
    id: 'key1',
    key: secret('5I0iSKw3yfBkQ4AXfA8eR-tWR0Q1dpn4x3bPrPzHkP0')
  })

  encrypt.mount(context)

  const encrypted = await encrypt.execute({
    authority,
    identity: { id: generate(), roles: [] }
  })

  if (encrypted instanceof Error)
    throw encrypted

  const header = JSON.parse(Buffer.from(encrypted.split('.')[0], 'base64url').toString())

  assert.partialDeepStrictEqual(header, { kid: 'key0', alg: 'dir', enc: 'A256GCM' })
})

it('should encrypt with configured lifetime by default', async () => {
  const identity: Identity = { id: generate(), roles: [] }

  const encrypted = await encrypt.execute({
    authority,
    identity
  })

  if (encrypted instanceof Error)
    throw encrypted

  await assert.partialDeepStrictEqual(await decrypt.execute(encrypted), { iss: authority, identity })

  await timeout(context.configuration.lifetime * 1000)

  const thrown: any = await decrypt.execute(encrypted)
        assert.deepStrictEqual(thrown.code, 'INVALID_TOKEN')
})

it('should encrypt with given lifetime', async () => {
  const identity: Identity = { id: generate(), roles: [] }
  const lifetime = 0.1

  const encrypted = await encrypt.execute({
    authority,
    identity,
    lifetime
  })

  if (encrypted instanceof Error)
    throw encrypted

  await assert.partialDeepStrictEqual(await decrypt.execute(encrypted), { iss: authority, identity })

  await timeout(lifetime * 1000)

  const thrown: any = await decrypt.execute(encrypted)
        assert.deepStrictEqual(thrown.code, 'INVALID_TOKEN')
})

it('should encrypt without lifetime INSECURE', async () => {
  const identity: Identity = { id: generate(), roles: [] }
  const lifetime = 0

  const encrypted = await encrypt.execute({
    authority,
    identity,
    lifetime
  })

  if (encrypted instanceof Error)
    throw encrypted

  const decrypted = await decrypt.execute(encrypted)

  assert.ok(!(decrypted instanceof Error))

  assert.partialDeepStrictEqual(decrypted.identity, identity)
})

it('should keep the identity permissions when none are given', async () => {
  const permissions = { '/notes/': ['GET'] }
  const identity: Identity = { id: generate(), roles: [], permissions }

  const encrypted = await encrypt.execute({ authority, identity, lifetime: 100 })

  if (encrypted instanceof Error)
    throw encrypted

  const decrypted = await decrypt.execute(encrypted)

  assert.ok(!(decrypted instanceof Error))
  assert.deepStrictEqual(decrypted.identity.permissions, permissions)
})

function secret (value: string): Secret {
  return { unwrap: () => value }
}
