'use strict'

const { lookup } = require('../../lookup')

function events (manifest) {
  if (manifest.events === undefined) return

  for (const event of Object.values(manifest.events)) {
    if (event.binding) event.binding = lookup(event.binding, manifest.path)
    if (event.bridge !== undefined) event.bridge = lookup(event.bridge, manifest.path)
  }
}

exports.events = events
