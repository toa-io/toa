'use strict'

const { Guard } = require('@toa.io/core')
const boot = require('./index')

async function guards(manifest, context) {
  if (manifest.guards === undefined)
    return 

  const entries = Object.entries(manifest.guards)

  return await Promise.all(entries.map(async ([name, guard]) => {
    const bridge = await load(guard, name, context)

    return new Guard(name, bridge)
  }))
}

async function load(guard, name, context) {
  return await boot.bridge.guard(guard.bridge, guard.path, name, context)
}

exports.guards = guards
