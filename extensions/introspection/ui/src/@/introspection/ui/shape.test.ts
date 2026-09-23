import { it, expect } from 'vitest'
import { read } from './shape'

const SYSTEM = {
  VERSION: { type: 'integer' },
  CREATED: { type: 'integer' },
  UPDATED: { type: 'integer' },
  DELETED: { type: 'integer', nullable: true },
  REGION: { type: 'integer' },
}

it('should drop what the runtime writes on every record', () => {
  const schema = {
    type: 'object',
    properties: { id: { type: 'string' }, title: { type: 'string' }, ...SYSTEM },
    required: ['id', 'title', ...Object.keys(SYSTEM)],
  }

  expect(read(schema)).toStrictEqual([
    { depth: 0, key: 'id', type: 'string', optional: false },
    { depth: 0, key: 'title', type: 'string', optional: false },
  ])
})

it('should drop them wherever they are held', () => {
  const schema = {
    type: 'object',
    properties: {
      id: { type: 'string' },
      shipments: {
        type: 'array',
        items: { type: 'object', properties: { carrier: { type: 'string' }, ...SYSTEM } },
      },
    },
  }

  expect(read(schema).map(({ depth, key, type }) => [depth, key, type])).toStrictEqual([
    [0, 'id', 'string'],
    [0, 'shipments[]', null],
    [1, 'carrier', 'string'],
  ])
})

it('should open onto nothing where it holds them and nothing else', () => {
  const schema = { type: 'object', properties: { record: { type: 'object', properties: SYSTEM } } }

  expect(read(schema)).toStrictEqual([
    { depth: 0, key: 'record', type: 'object', optional: true },
  ])
})
