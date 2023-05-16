'use strict'

const { secrets } = require('./secrets')

it('should be', async () => {
  expect(secrets).toBeInstanceOf(Function)
})

it('should find secrets', async () => {
  const configuration = {
    foo: {
      bar: '$BAR_VALUE'
    },
    baz: '$BAZ_VALUE'
  }

  const variables = new Set()
  const names = new Set()

  secrets(configuration, (variable, name) => {
    variables.add(variable)
    names.add(name)
  })

  expect(variables.has('TOA_CONFIGURATION__BAR_VALUE')).toStrictEqual(true)
  expect(variables.has('TOA_CONFIGURATION__BAZ_VALUE')).toStrictEqual(true)

  expect(names.has('BAR_VALUE')).toStrictEqual(true)
  expect(names.has('BAZ_VALUE')).toStrictEqual(true)
})

it('should replace values', async () => {
  const configuration = { foo: '$FOO' }

  const output = secrets(configuration, (variable) => 'hello')

  expect(output).toStrictEqual({ foo: 'hello' })
})

it('should allow numbers in secret names', async () => {
  const configuration = { foo: '$HOST_0' }
  const found = new Set()

  secrets(configuration, (variable) => found.add(variable))

  expect(found.has('TOA_CONFIGURATION__HOST_0')).toStrictEqual(true)
})
