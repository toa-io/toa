'use strict'

function receivers (component) {
  if (component.receivers === undefined) return

  const receivers = component.receivers

  for (const [key, value] of Object.entries(receivers)) {
    const segments = key.split('.')
    const source = value.source ?? 'default'

    if (source !== 'default') continue
    if (segments.length === 3) continue

    const newKey = 'default.' + key

    delete receivers[key]
    receivers[newKey] = value
  }
}

exports.receivers = receivers
