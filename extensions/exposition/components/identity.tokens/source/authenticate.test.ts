import { generate } from 'randomstring'
import { type Configuration, type Context, type DecryptOutput } from './types'
import { computation as authenticate } from './authenticate'

let configuration: Configuration
let context: Context
let output: DecryptOutput

const payload = { id: generate() }

beforeEach(() => {
  configuration = {
    key0: 'k3.local.m28p8SrbS467t-2IUjQuSOqmjvi24TbXhyjAW_dOrog',
    lifetime: 2592000,
    refresh: 600
  }

  context = {
    configuration,
    local: {
      decrypt: jest.fn(async () => ({ output }))
    }
  }
})

it.each([
  [true, -50],
  [false, +50]
])('should mark as stale: %s', async (expected: boolean, shift: number) => {
  const now = Date.now()
  const iat = new Date(now - configuration.refresh + shift).toISOString()
  const exp = new Date(now + 1000).toISOString()

  output = { payload, exp, iat, refresh: false }

  const result = await authenticate('', context)

  expect(result).toEqual({ output: { identity: payload, stale: expected } })
})

it.each([true, false])('should return stale: %s',
  async (refresh) => {
    const iat = new Date().toISOString()
    const exp = new Date(Date.now() + 1000).toISOString()

    output = { payload, exp, iat, refresh }

    const result = await authenticate('', context)

    expect(result).toEqual({ output: { identity: payload, stale: refresh } })
  })
