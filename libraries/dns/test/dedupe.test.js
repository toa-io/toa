'use strict'

const mock = require('./dns.mock')

jest.mock('node:dns/promises', () => mock)

const { dedupe } = require('../')

it('should be', async () => {
  expect(dedupe).toBeInstanceOf(Function)
})

it('should resolve hosts', async () => {
  const input = ['amqp://github.com:5672/vhost?test=true', 'https://google.com', 'https://nodejs.org/api/dns.html#dnslookuphostname-options-callback']
  const output = await dedupe(input)

  expect(output).toBeInstanceOf(Array)
  expect(output.length).toStrictEqual(input.length)
  expect(output).toStrictEqual(input)
})

it('should dedupe', async () => {
  const input = ['amqp://github.com:5672/vhost?test=true', 'amqp://github.com:5672/vhost?test=true', 'amqp://github.com:5672']
  const output = await dedupe(input)

  expect(output.length).toStrictEqual(2)
})

it('should dedupe host name and ip', async () => {
  const input = ['http://localhost', 'http://127.0.0.1']
  const urls = await dedupe(input)

  expect(urls).toStrictEqual(['http://localhost'])
})
