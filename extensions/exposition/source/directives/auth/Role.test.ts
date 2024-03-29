import { type Component } from '@toa.io/core'
import { generate } from 'randomstring'
import { Role } from './Role'
import { type Identity } from './types'
import type { Parameter } from '../../RTD'

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

  const identity: Identity = {
    id: generate(),
    scheme: '',
    refresh: false
  }

  remote.invoke.mockResolvedValueOnce(['guest'])

  const result = await directive.authorize(identity, undefined, [])

  expect(result).toBe(false)

  expect(remote.invoke)
    .toBeCalledWith('list', {
      query: {
        criteria: `identity==${identity.id}`,
        limit: 1024
      }
    })
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

it('should return true on match with parameters', async () => {
  const result = await match(['app:{org}:reviews'],
    ['app:29e54ae1:reviews'], [{
      name: 'org',
      value: '29e54ae1'
    }])

  expect(result).toBe(true)
})

it('should return true on match with parameters', async () => {
  const result = await match(['app:{org}:reviews'],
    ['app:29e54ae1:reviews'], [{
      name: 'org',
      value: '29e54ae1'
    }])

  expect(result).toBe(true)
})

it('should return false on mismatch with parameters', async () => {
  const result = await match(['app:{org}:reviews'],
    ['app:29e54ae1:reviews'], [{
      name: 'org',
      value: '88584c9b'
    }])

  expect(result).toBe(false)
})

async function match
(expected: string[], actual: string[], parameters: Parameter[] = []): Promise<boolean> {
  const directive = new Role(expected, discovery)

  const identity: Identity = {
    id: generate(),
    scheme: '',
    refresh: false
  }

  remote.invoke.mockResolvedValueOnce(actual)

  return await directive.authorize(identity, undefined, parameters)
}
