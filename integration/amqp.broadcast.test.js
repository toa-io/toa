'use strict'

const { Factory } = require('../connectors/bindings.amqp')
const { generate } = require('randomstring')
const framework = require('./framework')

let factory, a, b, c

beforeAll(async () => {
  framework.dev(true)

  factory = new Factory()

  const prefix = 'test-prefix'

  a = factory.broadcast(prefix)
  b = factory.broadcast(prefix)
  c = factory.broadcast(prefix)

  await a.connect()
  await b.connect()
  await c.connect()
})

afterAll(async () => {
  if (a) await a.disconnect()
  if (b) await b.disconnect()
  if (c) await c.disconnect()

  framework.env()
})

it('should receive', async () => {
  expect.assertions(2)

  const label = 'test-label'
  const message = { [generate()]: generate() }

  let receivedA, receivedB

  const receiving = Promise.all([
    new Promise((resolve) => (receivedA = resolve)),
    new Promise((resolve) => (receivedB = resolve))
  ])

  await a.receive(label, (payload) => {
    expect(payload).toStrictEqual(message)
    receivedA()
  })

  await b.receive(label, (payload) => {
    expect(payload).toStrictEqual(message)
    receivedB()
  })

  await b.transmit(label, message)
  await receiving
})
