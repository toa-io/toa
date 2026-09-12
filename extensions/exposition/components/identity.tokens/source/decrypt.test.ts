import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createCipheriv, randomBytes } from 'node:crypto'

import { generate } from 'randomstring'
import { EncryptFactory, ImportKeyFactory } from 'paseto/v3/local'
import { Effect as Encrypt } from './encrypt.ts'
import { Computation as Decrypt } from './decrypt.ts'
import { type Configuration, type Context, type Identity } from './lib/index.ts'
import type { Secret } from '@toa.io/extensions.configuration'

let configuration: Configuration
let context: Context
let encrypt: Encrypt
let decrypt: Decrypt

const remote = { identity: { keys: { observe: mock.fn(async () => null) } } }
const authority = generate()

beforeEach(() => {
  configuration = {
    keys: [
      { id: 'key0', key: secret('sTxL6qVOadKkUJwh3FveU53XgTEo3Sdfg7k2FfiIKfs') },
      // keys are secrets, and a secret is an object
      { id: 'key1', key: secret('5I0iSKw3yfBkQ4AXfA8eR-tWR0Q1dpn4x3bPrPzHkP0') },
      {
        id: 'legacy0',
        key: secret('k3.local.m28p8SrbS467t-2IUjQuSOqmjvi24TbXhyjAW_dOrog'),
        format: 'paseto'
      },
      {
        id: 'legacy1',
        key: secret('k3.local.-498jfWenrZH-Dqw3-zQJih_hKzDgBgUMfe37OCqSOA'),
        format: 'paseto'
      }
    ],
    lifetime: 1000,
    refresh: 500,
    cache: {
      max: 1024,
      ttl: 600
    }
  }

  context = {
    configuration,
    remote,
    logs: { debug: () => undefined }
  } as unknown as Context

  encrypt = new Encrypt()
  encrypt.mount(context)

  decrypt = new Decrypt()
  decrypt.mount(context)
})

it('should decrypt', async () => {
  const identity: Identity = { id: generate(), roles: [] }
  const lifetime = 100

  const reply = await encrypt.execute({ authority, identity, lifetime })

  if (reply instanceof Error) throw reply

  const decrypted = await decrypt.execute(reply)

  assert.partialDeepStrictEqual(decrypted, {
    iss: authority,
    identity,
    refresh: false,
    custom: false
  })
})

it('should mark a token encrypted with a custom key', async () => {
  const identity: Identity = { id: generate(), roles: [] }
  const key = {
    id: generate(),
    key: '5I0iSKw3yfBkQ4AXfA8eR-tWR0Q1dpn4x3bPrPzHkP0',
    label: 'custom'
  }

  remote.identity.keys.observe = mock.fn(async ({ query }: { query: { id: string } }) =>
    query.id === key.id ? { ...key, identity: identity.id } : null
  ) as any

  const encrypted = await encrypt.execute({ authority, identity, lifetime: 100, key })

  if (encrypted instanceof Error) throw encrypted

  const decrypted = await decrypt.execute(encrypted)

  assert.partialDeepStrictEqual(decrypted, { identity, refresh: false, custom: true })
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

  if (encrypted instanceof Error) throw encrypted

  const decrypted = await decrypt.execute(encrypted)

  assert.partialDeepStrictEqual(decrypted, { identity, refresh: true })
})

it('should decrypt legacy PASETO and require refresh', async () => {
  const identity: Identity = { id: generate(), roles: [] }

  const token = await paseto(
    configuration.keys[2].key.unwrap(),
    { iss: authority, identity },
    'legacy0'
  )

  await assert.partialDeepStrictEqual(await decrypt.execute(token), {
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

  const token = await paseto(
    configuration.keys[2].key.unwrap(),
    { iss: authority, identity },
    'key0'
  )

  await assert.partialDeepStrictEqual(await decrypt.execute(token), {
    identity,
    refresh: true
  })
})

it('should reject a token under a revoked key', async () => {
  const identity: Identity = { id: generate(), roles: [] }
  const key = {
    id: generate(),
    key: '5I0iSKw3yfBkQ4AXfA8eR-tWR0Q1dpn4x3bPrPzHkP0',
    label: 'revoked'
  }

  remote.identity.keys.observe = mock.fn(async ({ query }: { query: { id: string } }) =>
    query.id === key.id ? { ...key, identity: identity.id, revokedAt: Date.now() } : null
  ) as any

  const encrypted = await encrypt.execute({ authority, identity, lifetime: 0, key })

  if (encrypted instanceof Error) throw encrypted

  const thrown: any = await decrypt.execute(encrypted)

  assert.deepStrictEqual(thrown.code, 'REVOKED_KEY')
})

it('should reject a tampered JWE', async () => {
  const token = await encrypt.execute({
    authority,
    identity: { id: generate(), roles: [] }
  })

  if (token instanceof Error) throw token

  const parts = token.split('.')

  parts[3] = (parts[3].startsWith('A') ? 'B' : 'A') + parts[3].slice(1)

  const tampered = parts.join('.')

  const thrown: any = await decrypt.execute(tampered)
  assert.deepStrictEqual(thrown.code, 'INVALID_TOKEN')
})

it('should reject JWE with an unknown key', async () => {
  const token = await encrypt.execute({
    authority,
    identity: { id: generate(), roles: [] },
    key: { id: 'missing', key: configuration.keys[0].key.unwrap(), label: 'missing' }
  })

  if (token instanceof Error) throw token

  const thrown: any = await decrypt.execute(token)
  assert.deepStrictEqual(thrown.code, 'INVALID_KEY')
})

// what a token is made of, written here so that what opens it is read against the standard
// rather than against itself
it('should open a token assembled by hand', async () => {
  const identity: Identity = { id: generate(), roles: [] }
  const token = jwe(configuration.keys[0].key.unwrap(), header(), {
    iss: authority,
    iat: Math.floor(Date.now() / 1000),
    identity
  })

  assert.partialDeepStrictEqual(await decrypt.execute(token), { iss: authority, identity })
})

for (const [what, replacement] of [
  ['an algorithm it does not issue', { alg: 'A256KW' }],
  ['an encryption it does not issue', { enc: 'A128GCM' }],
  ['a type it does not issue', { typ: 'at+jwt' }],
  ['no key id', { kid: undefined }],
  ['a critical header', { crit: ['exp'] }],
  ['compression', { zip: 'DEF' }]
] as Array<[string, Record<string, unknown>]>)
  it(`should reject a token with ${what}`, async () => {
    const token = jwe(configuration.keys[0].key.unwrap(), { ...header(), ...replacement }, claims())
    const thrown: any = await decrypt.execute(token)

    assert.deepStrictEqual(thrown.code, 'INVALID_TOKEN')
  })

it('should reject a token that carries an encrypted key', async () => {
  const parts = jwe(configuration.keys[0].key.unwrap(), header(), claims()).split('.')

  parts[1] = Buffer.from('key').toString('base64url')

  const thrown: any = await decrypt.execute(parts.join('.'))

  assert.deepStrictEqual(thrown.code, 'INVALID_TOKEN')
})

for (const [what, parts] of [
  ['four', 4],
  ['six', 6]
] as Array<[string, number]>)
  it(`should reject a token of ${what} parts`, async () => {
    const token = jwe(configuration.keys[0].key.unwrap(), header(), claims()).split('.')
    const changed = parts === 4 ? token.slice(0, 4) : token.concat('')
    const thrown: any = await decrypt.execute(changed.join('.'))

    assert.deepStrictEqual(thrown.code, 'INVALID_TOKEN')
  })

it('should reject a token whose initialization vector was changed', async () => {
  const parts = jwe(configuration.keys[0].key.unwrap(), header(), claims()).split('.')
  const iv = Buffer.from(parts[2], 'base64url')

  iv[0] ^= 0xff
  parts[2] = iv.toString('base64url')

  const thrown: any = await decrypt.execute(parts.join('.'))

  assert.deepStrictEqual(thrown.code, 'INVALID_TOKEN')
})

it('should reject a token whose expiry has passed', async () => {
  const token = jwe(configuration.keys[0].key.unwrap(), header(), {
    ...claims(),
    exp: Math.floor(Date.now() / 1000) - 1
  })
  const thrown: any = await decrypt.execute(token)

  assert.deepStrictEqual(thrown.code, 'INVALID_TOKEN')
})

it('should reject a token that is not valid yet', async () => {
  const token = jwe(configuration.keys[0].key.unwrap(), header(), {
    ...claims(),
    nbf: Math.floor(Date.now() / 1000) + 60
  })
  const thrown: any = await decrypt.execute(token)

  assert.deepStrictEqual(thrown.code, 'INVALID_TOKEN')
})

function secret(value: string): Secret {
  return { unwrap: () => value }
}

function header(): Record<string, unknown> {
  return { alg: 'dir', enc: 'A256GCM', typ: 'JWT', kid: 'key0' }
}

function claims(): Record<string, unknown> {
  return {
    iss: authority,
    iat: Math.floor(Date.now() / 1000),
    identity: { id: generate(), roles: [] }
  }
}

/** A compact JWE, `dir` and `A256GCM`, as RFC 7516 states it. */
function jwe(key: string, header: Record<string, unknown>, claims: object): string {
  const head = Buffer.from(
    JSON.stringify(Object.fromEntries(Object.entries(header).filter(([, v]) => v !== undefined)))
  ).toString('base64url')

  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(key, 'base64url'), iv)

  cipher.setAAD(Buffer.from(head, 'ascii'))

  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(claims), 'utf-8'),
    cipher.final()
  ])

  return [
    head,
    '',
    iv.toString('base64url'),
    ciphertext.toString('base64url'),
    cipher.getAuthTag().toString('base64url')
  ].join('.')
}

async function paseto(key: string, claims: object, kid: string): Promise<string> {
  const imported = await ImportKeyFactory().run(key as `k3.local.${string}`)

  return await EncryptFactory().run(imported, claims, {
    footer: new TextEncoder().encode(JSON.stringify({ kid }))
  })
}
