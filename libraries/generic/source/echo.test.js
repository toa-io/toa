'use strict'

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
  ['${TEST}', 'TEST', value, value], // eslint-disable-line no-template-curly-in-string
  ['a${FOO}', 'FOO', value, `a${value}`], // eslint-disable-line no-template-curly-in-string
  ['a${FOO}bar', 'FOO', value, `a${value}bar`] // eslint-disable-line no-template-curly-in-string
])('should substitute environment variables in %s',
  async (input, variable, value, expected) => {
    process.env[variable] = value

    const output = echo(input)

    expect(output).toStrictEqual(expected)
  })
