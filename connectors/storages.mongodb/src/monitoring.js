'use strict'

const { create, current, record } = require('openspan')

/**
 * Records MongoDB commands as client spans using the driver command monitoring events.
 * Requires the client to be created with `monitorCommands: true`.
 *
 * Commands executed outside of a sampled trace context are not recorded.
 *
 * @param {import('mongodb').MongoClient} client
 */
function monitor (client) {
  /** @type {Map<number, { context: object, time: number, attributes: object }>} */
  const pending = new Map()

  client.on('commandStarted', (event) => {
    if (IGNORE.has(event.commandName))
      return

    const parent = current()

    if (parent === undefined || !parent.sampled)
      return

    if (pending.size >= CAPACITY) // should never happen
      pending.delete(pending.keys().next().value)

    // https://opentelemetry.io/docs/specs/semconv/database/mongodb/
    const attributes = {
      'db.system': 'mongodb',
      'db.namespace': event.databaseName,
      'db.operation.name': event.commandName
    }

    const collection = event.command?.[event.commandName]

    if (typeof collection === 'string')
      attributes['db.collection.name'] = collection

    pending.set(event.requestId, {
      context: create(parent),
      time: Date.now(),
      attributes
    })
  })

  client.on('commandSucceeded', (event) => complete(event))
  client.on('commandFailed', (event) => complete(event, 'error'))

  function complete (event, status) {
    const started = pending.get(event.requestId)

    if (started === undefined)
      return

    pending.delete(event.requestId)

    const collection = started.attributes['db.collection.name']

    const span = {
      name: collection === undefined
        ? event.commandName
        : `${event.commandName} ${collection}`,
      traceId: started.context.traceId,
      spanId: started.context.spanId,
      parentId: started.context.parentId,
      kind: 'client',
      time: started.time,
      duration: event.duration,
      attributes: started.attributes,
      service: started.context.service
    }

    if (status !== undefined)
      span.status = status

    record(span)
  }
}

// internal commands, including authentication and connection management
const IGNORE = new Set(['hello', 'ismaster', 'ping', 'endSessions', 'saslStart', 'saslContinue'])

const CAPACITY = 1024

exports.monitor = monitor
