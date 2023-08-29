import { type Component } from '@toa.io/core'
import { generate } from 'randomstring'
import { Role } from './Role'
import { type Identity } from './types'

const remote = {
  invoke: jest.fn()
} as unknown as jest.MockedObject<Component>

const discovery = Promise.resolve(remote)

beforeEach(() => {
  jest.clearAllMocks()
})

it('should return false if not matched', async () => {
  const roles = ['admin', 'user']
  const directive = new Role(roles, discovery)
  const identity: Identity = { id: generate(), scheme: '', stale: false }

  remote.invoke.mockResolvedValueOnce({ output: [{ role: 'guest' }] })

  const result = await directive.authorize(identity)

  expect(result).toBe(false)

  expect(remote.invoke)
    .toBeCalledWith('enumerate', { query: { criteria: `identity==${identity.id}`, limit: 1024 } })
})

it('should return true on exact match', async () => {
  const result = await match(['admin', 'user'], ['user'])

  expect(result).toBe(true)
})

it('should return true on scope match', async () => {
  const result = await match(['system:identity:roles'], ['system'])

  expect(result).toBe(true)
})

it('should return false on scope mismatch', async () => {
  const result = await match(['system:identity'], ['system:identity:roles'])

  expect(result).toBe(false)
})

it('should return false on non-scope substring match', async () => {
  const result = await match(['system:identity'], ['system:iden'])

  expect(result).toBe(false)
})

async function match (expected: string[], actual: string[]): Promise<boolean> {
  const directive = new Role(expected, discovery)
  const identity: Identity = { id: generate(), scheme: '', stale: false }
  const output = actual.map((role) => ({ role }))

  remote.invoke.mockResolvedValueOnce({ output })

  return await directive.authorize(identity)
}
