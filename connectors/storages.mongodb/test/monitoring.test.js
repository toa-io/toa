'use strict'

const { EventEmitter } = require('node:events')
const { create, exporting, run, traces } = require('openspan')
const { monitor } = require('../src/monitoring')

let client
let spans

beforeEach(() => {
  client = new EventEmitter()
  spans = []

  exporting([{ export: (span) => spans.push(span) }])
  monitor(client)
})

afterEach(() => {
  traces()
})

const started = {
  requestId: 1,
  commandName: 'find',
  databaseName: 'toa-dev',
  command: { find: 'pots', filter: {} }
}

const succeeded = { requestId: 1, commandName: 'find', duration: 1.5 }
const failed = { requestId: 1, commandName: 'find', duration: 0.5, failure: 'boom' }

it('should record a command as a client span', () => {
  const context = create()

  run(context, () => client.emit('commandStarted', started))
  client.emit('commandSucceeded', succeeded)

  expect(spans).toHaveLength(1)

  expect(spans[0]).toMatchObject({
    name: 'find pots',
    traceId: context.traceId,
    parentId: context.spanId,
    kind: 'client',
    duration: 1.5,
    attributes: {
      'db.system': 'mongodb',
      'db.namespace': 'toa-dev',
      'db.operation.name': 'find',
      'db.collection.name': 'pots'
    }
  })

  expect(spans[0].status).toBeUndefined()
})

it('should record failed commands with error status', () => {
  run(create(), () => client.emit('commandStarted', started))
  client.emit('commandFailed', failed)

  expect(spans).toHaveLength(1)
  expect(spans[0].status).toBe('error')
})

it('should not record commands outside of a trace context', () => {
  client.emit('commandStarted', started)
  client.emit('commandSucceeded', succeeded)

  expect(spans).toHaveLength(0)
})

it('should not record commands of unsampled traces', () => {
  const context = { ...create(), sampled: false }

  run(context, () => client.emit('commandStarted', started))
  client.emit('commandSucceeded', succeeded)

  expect(spans).toHaveLength(0)
})

it('should ignore internal commands', () => {
  run(create(), () => {
    client.emit('commandStarted', { ...started, commandName: 'hello', command: { hello: 1 } })
  })

  client.emit('commandSucceeded', { ...succeeded, commandName: 'hello' })

  expect(spans).toHaveLength(0)
})

it('should name spans without a collection by the command', () => {
  const start = { ...started, commandName: 'listIndexes', command: { listIndexes: 1 } }

  run(create(), () => client.emit('commandStarted', start))
  client.emit('commandSucceeded', { ...succeeded, commandName: 'listIndexes' })

  expect(spans).toHaveLength(1)
  expect(spans[0].name).toBe('listIndexes')
})
