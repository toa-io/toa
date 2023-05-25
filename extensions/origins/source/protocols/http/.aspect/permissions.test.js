'use strict'

const { generate } = require('randomstring')
const { Permissions } = require('./permissions')

it('should be', async () => {
  expect(Permissions).toBeInstanceOf(Function)
})

it('should substitute env vars', async () => {
  const name = 'FOO_VALUE'
  const value = generate()

  process.env[name] = value

  const properties = { '/http:\/\/domain.com\/${FOO_VALUE}/': true }
  const permissions = new Permissions(properties)

  expect(permissions.test('http://other.domain.com/')).toStrictEqual(false)
  expect(permissions.test('http://domain.com/' + value)).toStrictEqual(true)

  delete process.env[name]
})
