import { it } from 'node:test'
import assert from 'node:assert/strict'

import { parse, type Configuration } from './Configuration.js'

const rest: Omit<Configuration, 'key' | 'condition'> = {
  interval: 1,
  requests: 1
}

it('should convert key', () => {
  const result: Partial<Configuration> = {
    key: [
      {
        method: 'ip'
      }
    ]
  }

  assert.partialDeepStrictEqual(parse({ key: 'ip', ...rest }), result)
  assert.partialDeepStrictEqual(parse({ key: ['ip'], ...rest }), result)
})

it('should convert condition', () => {
  assert.partialDeepStrictEqual(parse({ key: ['ip', 'path'], condition: { status: '404' }, ...rest }), {
    condition: [
      {
        method: 'status',
        options: '404'
      }
    ]
  })

  assert.partialDeepStrictEqual(parse({ key: 'ip', condition: { status: '404' }, ...rest }), {
    condition: [
      {
        method: 'status',
        options: '404'
      }
    ]
  })
})

it('should convert a key component that takes an argument', () => {
  assert.partialDeepStrictEqual(parse({ key: { segment: 'id' }, ...rest }), {
    key: [
      {
        method: 'segment',
        options: 'id'
      }
    ]
  })
})

it('should convert a mixed key', () => {
  assert.partialDeepStrictEqual(parse({ key: ['route', { segment: 'id' }, 'identity'], ...rest }), {
    key: [
      { method: 'route' },
      { method: 'segment', options: 'id' },
      { method: 'identity' }
    ]
  })
})
