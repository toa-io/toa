'use strict'

const { resolve } = require('node:path')
const boot = require('@toa.io/boot')
const { Connector, Locator } = require('@toa.io/core')
const { timeout } = require('@toa.io/generic')
const stage = require('@toa.io/userland/stage')

const root = resolve(__dirname, '../components')

let remote
let emitter
let consumer

beforeAll(async () => {
  process.env.TOA_DEV = '1'
  process.env.TOA_CONFIGURATION_TEA_POTS = '{}'

  // the outbox pumps on a tick; at the default five seconds a test would end before it ran
  process.env.TOA_OUTBOX_INTERVAL = '100'

  const path = resolve(root, 'tea.pots')

  await stage.composition([path])

  remote = await stage.remote('tea.pots')

  // what `store.orders` would emit, sent the way it would send it
  emitter = boot.bindings.emit(AMQP, new Locator('orders', 'store'), 'created')

  await emitter.connect()
})

afterAll(async () => {
  await consumer?.disconnect()
  await emitter.disconnect()
  await stage.shutdown()

  delete process.env.TOA_DEV
  delete process.env.TOA_CONFIGURATION_TEA_POTS
  delete process.env.TOA_OUTBOX_INTERVAL
})

it('should receive event', async () => {
  const created = await remote.invoke('transit', { input: { material: 'glass' } })
  const id = created.id
  const request = { query: { id } }

  await emitter.emit({ payload: { pot: id } })

  // the receiver books the pot on delivery, which is asynchronous
  const deadline = Date.now() + 5000

  let reply

  do {
    await timeout(50)

    reply = await remote.invoke('observe', request)
  } while (reply.booked !== true && Date.now() < deadline)

  expect(reply.booked).toStrictEqual(true)
})

it('should emit event', async () => {
  const material = 'steel'

  const received = new Promise((resolve) => {
    consumer = boot.receive('tea.pots.created', new Subscriber(resolve))
  })

  consumer = await consumer

  await consumer.connect()
  await remote.invoke('transit', { input: { material } })

  const payload = await received

  expect(payload.material).toStrictEqual(material)
})

/** What the event consumer hands deliveries to. */
class Subscriber extends Connector {
  #handler

  constructor (handler) {
    super()

    this.#handler = handler
  }

  async receive (message) {
    this.#handler(message.payload)
  }
}

const AMQP = '@toa.io/bindings.amqp'
