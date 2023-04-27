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
  })

it('should substitute custom variables', async () => {
  const vars = { foo: 'world' }
  const template = 'hello ${foo}'
  const result = echo(template, vars)

  expect(result).toStrictEqual('hello world')
})

it('should substitute arrays', async () => {
  // {2} is replaces with empty string
  const result = echo('make {0} not {1}{2}', ['love', 'war'])

  expect(result).toStrictEqual('make love not war')
})
