'use strict'

const { split } = require('../')

it('should exist', () => {
  expect(split).toBeDefined()
})

it('should split string', () => {
  const string = 'one two three'
  const array = split(string)

  expect(array).toStrictEqual(['one', 'two', 'three'])
})

it('should split with double quotes', () => {
  const string = 'one two "three four"'
  const array = split(string)

  expect(array).toStrictEqual(['one', 'two', 'three four'])
})

it('should split with single quotes', () => {
  const string = 'one two \'three four\' five'
  const array = split(string)

  expect(array).toStrictEqual(['one', 'two', 'three four', 'five'])
})

it('should split with nested double quotes', () => {
  const string = 'one two \'three "and" four\' five'
  const array = split(string)

  expect(array).toStrictEqual(['one', 'two', 'three "and" four', 'five'])
})

it('should split with nested single quotes', () => {
  const string = 'one two "three \'or\' four" five'
  const array = split(string)

  expect(array).toStrictEqual(['one', 'two', 'three \'or\' four', 'five'])
})
