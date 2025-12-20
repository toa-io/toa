'use strict'

const load = require('../load')

const guard = async (root, label) => {
  const module = await load.guard(root, label)

  if (module.guard === undefined)
    throw new Error(`Guard ${label} not found`)

  return module.guard
}

const guards = async (root) => {
  const modules = await load.guards(root)
  const guards = modules.filter(([, module]) => module.guard !== undefined)

  return Object.fromEntries(guards.map(([name, module]) => [name, {}]))
}

exports.guard = guard
exports.guards = guards
