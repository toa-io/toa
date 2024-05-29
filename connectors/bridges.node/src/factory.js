'use strict'

const load = require('./load')
const { Runner } = require('./algorithms/runner')
const { Event } = require('./event')
const { Receiver } = require('./receiver')
const { Context } = require('./context')
const { extract } = require('./define/operations')

class Factory {
  async algorithm (root, name, context) {
    const module = load.operation(root, name)
    const ctx = new Context(context)

    return runner(module, ctx)
  }

  event (root, label, context) {
    const event = load.event(root, label)
    const ctx = new Context(context)

    return new Event(event, ctx)
  }

  receiver (root, label) {
    if (label.startsWith(DEFAULT)) label = label.substring(DEFAULT.length)

    const receiver = load.receiver(root, label)

    return new Receiver(receiver)
  }
}

/**
 * @param {Object} module
 * @param {toa.node.Context} context
 * @returns {Runner}
 */
async function runner (module, context) {
  const descriptor = extract(module)
  const func = module[descriptor.name]
  const factory = require('./algorithms/' + descriptor.syntax)
  const instance = await factory.create(func)

  return new Runner(instance, context)
}

const DEFAULT = 'default.'

exports.Factory = Factory
