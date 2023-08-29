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
    stale: 0.5
  }

  context = {
    configuration,
    local: {
      decrypt: jest.fn(async () => ({ output }))
    }
  }
})

it.each([
  [true, -1],
  [false, +1]
])('should mark as stale: %s', async (expected: boolean, shift: number) => {
  const now = Date.now()
  const left = LIFETIME * (1 - configuration.stale) + shift
  const right = LIFETIME * configuration.stale + shift
  const iat = new Date(now - left).toISOString()
  const exp = new Date(now + right).toISOString()

  output = { payload, exp, iat }

  const result = await authenticate('', context)

  expect(result).toEqual({ output: { identity: payload, stale: expected } })
})

const LIFETIME = 2592000 * 1000
