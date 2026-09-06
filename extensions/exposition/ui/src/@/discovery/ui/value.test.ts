import { it, expect } from 'vitest'
import { read } from './value'

it('should read a scalar', () => {
  expect(read('one')).toStrictEqual([{ depth: 0, key: null, type: 'one', optional: false }])
  expect(read(null)).toStrictEqual([{ depth: 0, key: null, type: 'null', optional: false }])
})

it('should read an object without a line of its own', () => {
  expect(read({ id: 1, name: 'pot' }).map(({ depth, key, type }) => [depth, key, type])).toStrictEqual([
    [0, 'id', '1'],
    [0, 'name', 'pot'],
  ])
})

it('should indent what a property holds', () => {
  const lines = read({ message: { text: 'hi' } })

  expect(lines.map(({ depth, key, type }) => [depth, key, type])).toStrictEqual([
    [0, 'message', null],
    [1, 'text', 'hi'],
  ])
})

it('should mark what a list holds', () => {
  const lines = read({ tags: ['a', 'b'] })

  expect(lines.map(({ depth, key, type }) => [depth, key, type])).toStrictEqual([
    [0, 'tags', null],
    [1, null, '- a'],
    [1, null, '- b'],
  ])
})

it('should open an object a list holds', () => {
  const lines = read([{ id: 1 }])

  expect(lines.map(({ depth, key, type }) => [depth, key, type])).toStrictEqual([
    [0, null, '-'],
    [1, 'id', '1'],
  ])
})

it('should say that nothing is there', () => {
  expect(read({ tags: [], of: {} }).map(({ key, type }) => [key, type])).toStrictEqual([
    ['tags', '[]'],
    ['of', '{}'],
  ])
})

it('should keep an empty string readable', () => {
  expect(read({ name: '' })[0]?.type).toBe("''")
})
