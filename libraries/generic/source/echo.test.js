'use strict'

const { it } = require('node:test')
const assert = require('node:assert/strict')

/* eslint-disable no-template-curly-in-string */

const { generate } = require('randomstring')
const { echo } = require('../')

it('should be', async () => {
  assert.ok(echo instanceof Function)
})

it('should return input', async () => {
  const input = generate()
  const output = echo(input)

  assert.deepStrictEqual(output, input)
})

const sample = generate()

for (const [input, variable, value, expected] of [
  ['${TEST}', 'TEST', sample, sample],
  ['a${FOO}', 'FOO', sample, `a${sample}`],
  ['a${FOO_BAR}bar', 'FOO_BAR', sample, `a${sample}bar`]
])
   it(`should substitute environment variables in ${input}`, async () => {
    process.env[variable] = value

    const output = echo(input)

    assert.deepStrictEqual(output, expected)

    delete process.env[variable]
  })

it('should substitute custom variables', async () => {
  const vars = { foo: 'world' }
  const template = 'hello ${foo}'
  const result = echo(template, vars)

  assert.deepStrictEqual(result, 'hello world')
})

it('should substitute missing values with an empty string', async () => {
  const template = 'hello ${FOO}'
  const result = echo(template)

  assert.deepStrictEqual(result, 'hello ')
})

it('should substitute arrays', async () => {
  // {2} is replaced with an empty string
  const result = echo('make {0} not {1}{2}', ['love', 'war'])

  assert.deepStrictEqual(result, 'make love not war')
})

it('should not replace non-numbers', async () => {
  const result = echo('{0}{1-2}{1}', ['foo', 'bar'])

  assert.deepStrictEqual(result, 'foo{1-2}bar')
})

it('should substitute arguments', async () => {
  assert.deepStrictEqual(echo('hello {0}', 'world'), 'hello world')
  assert.deepStrictEqual(echo('make {0} not {1}', 'love', 'war'), 'make love not war')
})
