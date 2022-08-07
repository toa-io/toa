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

    const descriptor = extract(module)
    const func = module[descriptor.name]
    const factory = require('./algorithms/' + descriptor.syntax)
    const instance = factory.create(func, ctx)

    return new Runner(instance, ctx)
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

exports.Factory = Factory
