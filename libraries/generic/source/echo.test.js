'use strict'

/* eslint-disable no-template-curly-in-string */

const { generate } = require('randomstring')
const { echo } = require('../')

it('should be', async () => {
  expect(echo).toBeInstanceOf(Function)
})

it('should return input', async () => {
  const input = generate()
  const output = echo(input)

  expect(output).toStrictEqual(input)
})

const value = generate()

it.each([
  ['${TEST}', 'TEST', value, value],
  ['a${FOO}', 'FOO', value, `a${value}`],
  ['a${FOO_BAR}bar', 'FOO_BAR', value, `a${value}bar`]
])('should substitute environment variables in %s',
  async (input, variable, value, expected) => {
    process.env[variable] = value

    const output = echo(input)

    expect(output).toStrictEqual(expected)

    delete process.env[variable]
  })

it('should substitute custom variables', async () => {
  const vars = { foo: 'world' }
  const template = 'hello ${foo}'
  const result = echo(template, vars)

  expect(result).toStrictEqual('hello world')
})

it('should substitute missing values with an empty string', async () => {
  const template = 'hello ${FOO}'
  const result = echo(template)

  expect(result).toStrictEqual('hello ')
})

it('should substitute arrays', async () => {
  // {2} is replaced with an empty string
  const result = echo('make {0} not {1}{2}', ['love', 'war'])

  expect(result).toStrictEqual('make love not war')
})

it('should not replace non-numbers', async () => {
  const result = echo('{0}{1-2}{1}', ['foo', 'bar'])

  expect(result).toStrictEqual('foo{1-2}bar')
})

it('should substitute arguments', async () => {
  expect(echo('hello {0}', 'world')).toStrictEqual('hello world')
  expect(echo('make {0} not {1}', 'love', 'war')).toStrictEqual('make love not war')
})
