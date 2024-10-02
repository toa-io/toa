import { generate } from 'randomstring'
import { Computation as Authenticate } from './authenticate'
import type { Configuration, Context, DecryptOutput, Identity } from './lib'

let configuration: Configuration
let context: Context
let output: DecryptOutput
let authenticate: Authenticate

const identity: Identity = { id: generate(), roles: [] }
const authority = generate()

beforeEach(() => {
  configuration = {
    keys: {
      key0: 'k3.local.m28p8SrbS467t-2IUjQuSOqmjvi24TbXhyjAW_dOrog'
    },
    lifetime: 2592000,
    refresh: 600,
    cache: 600
  }

  context = {
    configuration,
    local: {
      decrypt: jest.fn(async () => (output)),
      observe: jest.fn(async () => null)
    }
  } as unknown as Context

  authenticate = new Authenticate()
  authenticate.mount(context)
})

it.each([
  [true, -50],
  [false, +50]
])('should mark as stale: %s', async (expected: boolean, shift: number) => {
  const now = Date.now()
  const iat = new Date(now - configuration.refresh * 1000 + shift).toISOString()
  const exp = new Date(now + 1000).toISOString()

  output = { iss: authority, identity, exp, iat, refresh: false }

  const result = await authenticate.execute({
    authority,
    credentials: ''
  })

  expect(result).toEqual({ identity, refresh: expected })
})

it.each([true, false])('should return stale: %s',
  async (refresh) => {
    const iat = new Date().toISOString()
    const exp = new Date(Date.now() + 1000).toISOString()

    output = { iss: authority, identity, exp, iat, refresh }

    const result = await authenticate.execute({
      authority,
      credentials: ''
    })

    expect(result).toEqual({ identity, refresh })
  })
