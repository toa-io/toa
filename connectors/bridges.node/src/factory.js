'use strict'

const load = require('./load')
const { Runner } = require('./algorithms/runner')
const { Event } = require('./event')
const { Receiver } = require('./receiver')
const { Guard } = require('./guard')
const { Context } = require('./context')
const { Phase } = require('./rc')
const { extract } = require('./define/operations')

class Factory {
  async algorithm (root, name, context) {
    const module = load.operation(root, name)
    const ctx = new Context(context, name)

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

  guard (root, label, context) {
    const guard = load.guard(root, label)
    const ctx = new Context(context)

    return new Guard(guard, ctx)
  }

  async rc (root, context) {
    const modules = await load.rcs(root)

    if (modules.length === 0)
      return

    const ctx = new Context(context)
    const preflights = []
    const settles = []

    for (const [name, module] of modules) {
      if (typeof module.preflight !== 'function' && typeof module.settle !== 'function')
        throw new Error(`RC '${name}' must export preflight and/or settle`)

      if (typeof module.preflight === 'function')
        preflights.push(module.preflight)

      if (typeof module.settle === 'function')
        settles.push(module.settle)
    }

    return {
      preflight: preflights.length > 0 ? new Phase(preflights, ctx) : undefined,
      settle: settles.length > 0 ? new Phase(settles, ctx) : undefined
    }
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
