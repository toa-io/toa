'use strict'

const { resolve } = require('../../shortcuts')

function events (manifest) {
  if (manifest.events === undefined) return

  for (const event of Object.values(manifest.events)) {
    if (event.binding !== undefined) event.binding = resolve(event.binding)
    if (event.bridge !== undefined) event.bridge = resolve(event.bridge)
  }
}

exports.events = events
