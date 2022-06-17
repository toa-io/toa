'use strict'

function receivers (manifest) {
  if (manifest.receivers === undefined) return

  for (const [locator, receiver] of Object.entries(manifest.receivers)) {
    if (typeof receiver === 'string') manifest.receivers[locator] = { transition: receiver }
  }
}

exports.receivers = receivers
