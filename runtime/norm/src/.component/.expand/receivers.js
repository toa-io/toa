'use strict'

const { resolve } = require('../../shortcuts')

function receivers (manifest) {
  if (manifest.receivers === undefined) return

  for (const [locator, receiver] of Object.entries(manifest.receivers)) {
    if (typeof receiver === 'string') manifest.receivers[locator] = { transition: receiver }

    if (receiver.binding !== undefined) receiver.binding = resolve(receiver.binding)
    if (receiver.bridge !== undefined) receiver.bridge = resolve(receiver.bridge)
  }
}

exports.receivers = receivers
