'use strict'

const { resolve } = require('../../lookup')

function events (manifest) {
  if (manifest.events === undefined) return

  for (const event of Object.values(manifest.events)) {
    if (event.binding) event.binding = resolve(event.binding, manifest.path)
    if (event.bridge !== undefined) event.bridge = resolve(event.bridge, manifest.path)
  }
}

exports.events = events
