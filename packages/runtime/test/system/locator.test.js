'use strict'

const { Locator } = require('../../src/system/locator')

it('should inherit domain, entity, endpoints', () => {
  const domain = 'foo'
  const name = 'bar'
  const endpoints = [1, 2, 3]

  const locator = new Locator({ domain, name }, endpoints)

  expect(locator.domain).toBe(domain)
  expect(locator.name).toBe(name)
  expect(locator.endpoints).toBe(endpoints)
})

it('should provide system host', () => {
  const locator = new Locator({ domain: 'foo', name: 'bar' })

  expect(locator.host('amqp')).toBe('system.amqp.local')
})
