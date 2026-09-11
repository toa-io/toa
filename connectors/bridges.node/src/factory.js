import * as load from './load.js'
import { Runner } from './algorithms/runner.js'
import { Event } from './event.js'
import { Receiver } from './receiver.js'
import { Guard } from './guard.js'
import { Context } from './context.js'
import { Phase, Teardown } from './rc.js'
import { algorithm } from './algorithm.js'
import * as classes from './algorithms/class.js'
import * as factories from './algorithms/factory.js'
import * as functions from './algorithms/function.js'

// a closed set, so the graph stays analysable
const SYNTAXES = { class: classes, factory: factories, function: functions }

export class Factory {
  async algorithm(root, name, context) {
    const module = await load.operation(root, name)
    const ctx = new Context(context, name)

    return runner(module, ctx)
  }

  async event(root, label, context) {
    const event = await load.event(root, label)
    const ctx = new Context(context)

    return new Event(event, ctx)
  }

  async receiver(root, label) {
    if (label.startsWith(DEFAULT)) label = label.substring(DEFAULT.length)

    const receiver = await load.receiver(root, label)

    return new Receiver(receiver)
  }

  async guard(root, label, context) {
    const guard = await load.guard(root, label)
    const ctx = new Context(context)

    return new Guard(guard, ctx)
  }

  async rc(root, context) {
    const modules = await load.rcs(root)

    if (modules.length === 0) return

    const ctx = new Context(context)
    const preflights = []
    const settles = []
    const readies = []
    const disposals = []

    for (const [name, module] of modules) {
      if (
        typeof module.preflight !== 'function' &&
        typeof module.settle !== 'function' &&
        typeof module.ready !== 'function' &&
        typeof module.dispose !== 'function'
      )
        throw new Error(
          `RC '${name}' must export preflight, settle, ready and/or dispose`
        )

      if (typeof module.preflight === 'function') preflights.push(module.preflight)

      if (typeof module.settle === 'function') settles.push(module.settle)

      if (typeof module.ready === 'function') readies.push(module.ready)

      if (typeof module.dispose === 'function') disposals.push(module.dispose)
    }

    return {
      preflight: preflights.length > 0 ? new Phase(preflights, ctx) : undefined,
      settle: settles.length > 0 ? new Phase(settles, ctx) : undefined,
      ready: readies.length > 0 ? new Phase(readies, ctx) : undefined,
      dispose: disposals.length > 0 ? new Teardown(disposals, ctx) : undefined
    }
  }
}

/**
 * @param {Object} module
 * @param {toa.node.Context} context
 * @returns {Runner}
 */
async function runner(module, context) {
  const { func, syntax } = algorithm(module)
  const instance = await SYNTAXES[syntax].create(func)

  return new Runner(instance, context)
}

const DEFAULT = 'default.'
