import { it } from 'node:test'
import assert from 'node:assert/strict'

import { split } from '../source/index.js'

it('should exist', () => {
  assert.notStrictEqual(split, undefined)
})

it('should split string', () => {
  const string = 'one two three'
  const array = split(string)

  assert.deepStrictEqual(array, ['one', 'two', 'three'])
})

it('should split with double quotes', () => {
  const string = 'one two "three four"'
  const array = split(string)

  assert.deepStrictEqual(array, ['one', 'two', 'three four'])
})

it('should split with single quotes', () => {
  const string = 'one two \'three four\' five'
  const array = split(string)

  assert.deepStrictEqual(array, ['one', 'two', 'three four', 'five'])
})

it('should split with nested double quotes', () => {
  const string = 'one two \'three "and" four\' five'
  const array = split(string)

  assert.deepStrictEqual(array, ['one', 'two', 'three "and" four', 'five'])
})

it('should split with nested single quotes', () => {
  const string = 'one two "three \'or\' four" five'
  const array = split(string)

  assert.deepStrictEqual(array, ['one', 'two', 'three \'or\' four', 'five'])
})
