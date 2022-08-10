'use strict'

const load = require('./load')
const { Runner } = require('./algorithms/runner')
const { Event } = require('./event')
const { Receiver } = require('./receiver')
const { Context } = require('./context')
const { extract } = require('./define/operations')

/**
 * @implements {toa.core.bridges.Factory}
 */
class Factory {
  algorithm (root, name, context) {
    const module = load.operation(root, name)
    const ctx = new Context(context)

    return runner(module, ctx)
  }

  event (root, label) {
    const event = load.event(root, label)

    return new Event(event)
  }

  receiver (root, label) {
    const receiver = load.receiver(root, label)

    return new Receiver(receiver)
  }
}

/**
 * @param {Object} module
 * @param {toa.node.Context} context
 * @returns {Runner}
 */
function runner (module, context) {
  const descriptor = extract(module)
  const func = module[descriptor.name]
  const factory = require('./algorithms/' + descriptor.syntax)
  const ctor = () => factory.create(func, context)

  return new Runner(ctor, context)
}

exports.Factory = Factory
