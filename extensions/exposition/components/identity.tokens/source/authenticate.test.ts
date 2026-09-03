import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { generate } from 'randomstring'
import { Computation as Authenticate } from './authenticate.js'
import type { Configuration, Context, DecryptOutput, Identity } from './lib/index.js'
import type { Secret } from '@toa.io/types'

let configuration: Configuration
let context: Context
let output: DecryptOutput
let authenticate: Authenticate

const identity: Identity = { id: generate(), roles: [] }
const authority = generate()

beforeEach(() => {
  configuration = {
    keys: [
      { id: 'key0', key: secret('sTxL6qVOadKkUJwh3FveU53XgTEo3Sdfg7k2FfiIKfs') },
      { id: 'legacy0', key: secret('k3.local.m28p8SrbS467t-2IUjQuSOqmjvi24TbXhyjAW_dOrog'), format: 'paseto' }
    ],
    lifetime: 2592000,
    refresh: 600,
    cache: {
      max: 1024,
      ttl: 600
    }
  }

  context = {
    configuration,
    local: {
      decrypt: mock.fn(async () => (output)),
      observe: mock.fn(async () => null)
    }
  } as unknown as Context

  authenticate = new Authenticate()
  authenticate.mount(context)
})

for (const [expected, shift] of [
  [true, -50],
  [false, +50]
])
   it(`should mark as stale: ${expected}`, async () => {
  const now = Date.now()
  const iat = new Date(now - configuration.refresh * 1000 + shift).toISOString()
  const exp = new Date(now + 1000).toISOString()

  output = { iss: authority, identity, exp, iat, refresh: false }

  const result = await authenticate.execute({
    authority,
    credentials: ''
  })

  assert.deepStrictEqual(result, { identity, refresh: expected })
})

for (const refresh of [true, false])
   it(`should return stale: ${refresh}`, async () => {
    const iat = new Date().toISOString()
    const exp = new Date(Date.now() + 1000).toISOString()

    output = { iss: authority, identity, exp, iat, refresh }

    const result = await authenticate.execute({
      authority,
      credentials: ''
    })

    assert.deepStrictEqual(result, { identity, refresh })
  })

function secret (value: string): Secret {
  return { unwrap: () => value }
}
