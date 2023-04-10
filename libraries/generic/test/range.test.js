'use strict'

const { random, range } = require('../')

it('should be', async () => {
  expect(range).toBeInstanceOf(Function)
})

it('should expand ranges', async () => {
  const min = random(10)
  const max = random(10) + 10
  const expected = gen(min, max)
  const input = min + '-' + max
  const output = range(input)

  same(output, expected)
})

it('should expand ranges with dots separator', async () => {
  const min = random(10)
  const max = random(10) + 10
  const expected = gen(min, max)
  const input = min + '..' + max
  const output = range(input)

  same(output, expected)
})

it('should parse enumerations', async () => {
  const a = random(10)
  const b = random(10) + 10
  const expected = [a, b]
  const input = a + ',' + b
  const output = range(input)

  same(output, expected)
})

it('should expand enumerations with ranges', async () => {
  const input = '1-3, 7, 12-13'
  const expected = [1, 2, 3, 7, 12, 13]
  const output = range(input)

  same(output, expected)
})

it('should throw on garbage input', async () => {
  expect(() => range('hello')).toThrow('Invalid input format')
})

function gen (min, max) {
  const array = []

  for (let i = min; i <= max; i++) array.push(i)

  return array
}

function same (a, b) {
  expect(a.length).toStrictEqual(b.length)
  expect(a).toStrictEqual(expect.arrayContaining(b))
}
