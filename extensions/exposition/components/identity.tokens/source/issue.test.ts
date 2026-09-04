import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { generate } from 'randomstring'
import { Effect as Issue } from './issue.js'
import type { Context, EncryptInput } from './lib/index.js'

const LIFETIME = 2592000 // seconds, the configured default
const identity = generate()
const authority = generate()
const label = generate()

let issue: Issue
let encrypted: EncryptInput

beforeEach(() => {
  const context = {
    configuration: { lifetime: LIFETIME },
    remote: {
      identity: {
        keys: { create: mock.fn(async () => ({ id: 'kid0', key: 'secret' })) },
        roles: { list: mock.fn(async () => []) }
      }
    },
    local: {
      encrypt: mock.fn(async ({ input }: { input: EncryptInput }) => {
        encrypted = input

        return 'token'
      })
    }
  } as unknown as Context

  issue = new Issue()
  issue.mount(context)
})

/**
 * The configured lifetime is seconds, as the schema says and as `encrypt` reads it. Storing
 * it as milliseconds and then multiplying again put the expiration some eighty thousand years
 * out, and only on this path — every scenario passes a lifetime of its own.
 */
it('should expire a token issued without a lifetime as the configuration says', async () => {
  const now = Date.now()
  const reply: any = await issue.execute({ authority, identity, label })

  const seconds = (reply.exp - now) / 1000

  assert.ok(Math.abs(seconds - LIFETIME) < 10,
    `expected to expire in about ${LIFETIME} seconds, got ${seconds}`)
})

it('should hand the lifetime to `encrypt` in the seconds it reads', async () => {
  await issue.execute({ authority, identity, label })

  assert.equal(encrypted.lifetime, LIFETIME)
})

it('should expire a token as its own lifetime says', async () => {
  const now = Date.now()
  const reply: any = await issue.execute({ authority, identity, label, lifetime: 600 })

  assert.ok(Math.abs((reply.exp - now) / 1000 - 600) < 10)
  assert.equal(encrypted.lifetime, 600)
})

it('should issue a token that does not expire INSECURE', async () => {
  const reply: any = await issue.execute({ authority, identity, label, lifetime: 0 })

  assert.equal(reply.exp, undefined)
})
