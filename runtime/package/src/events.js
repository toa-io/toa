'use strict'

const { lookup, merge } = require('@kookaburra/gears')

const events = async (root, manifest) => {
  const events = []

  if (manifest.events) {
    for (const event of manifest.events) {
      if (typeof event.label !== 'string') throw new Error('Missing label for event')
      if (event.bridge === undefined || event.bridge === manifest.bridge) continue // default bridge later

      const module = lookup(event.bridge || manifest.bridge)
      const { declare } = require(module)
      const declaration = await declare.event(root, event.label)

      merge(event, declaration)
      events.push(event)
    }
  }

  for (const event of await scan(manifest.bridge, root)) {
    event.bridge = manifest.bridge

    const declared = manifest.events?.find((declared) => declared.label === event.label)

    if (declared !== undefined) merge(declared, event)
    else events.push(event)
  }

  events.forEach((event) => (event.path = root))

  manifest.events = events
}

const scan = async (bridge, root) => {
  const module = lookup(bridge)
  const { declare } = require(module)

  return declare.events(root)
}

exports.events = events
