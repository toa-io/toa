'use strict'

const { shards } = require('../')

it('should be', async () => {
  expect(shards).toBeInstanceOf(Function)
})

it('should expand shards', async () => {
  const input = 'amqp://host{0-3}.domain.com/?test=1'
  const output = shards(input)

  const expected = [
    'amqp://host0.domain.com/?test=1',
    'amqp://host1.domain.com/?test=1',
    'amqp://host2.domain.com/?test=1',
    'amqp://host3.domain.com/?test=1'
  ]

  expect(output.length).toStrictEqual(expected.length)
  expect(output).toStrictEqual(expect.arrayContaining(expected))
})

it('should return input if no range specified', async () => {
  const input = 'hello'
  const output = shards(input)

  expect(output.length).toStrictEqual(1)
  expect(output[0]).toStrictEqual(input)
})

it('should handle one-element range', async () => {
  const input = 'host{1}.domain.com'
  const output = shards(input)

  expect(output.length).toStrictEqual(1)
  expect(output[0]).toStrictEqual('host1.domain.com')
})
