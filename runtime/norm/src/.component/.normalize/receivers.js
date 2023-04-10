'use strict'

const receivers = (component) => {
  if (component.receivers === undefined) return

  for (const [_, receiver] of Object.entries(component.receivers)) {
    if (receiver.binding !== undefined && !receiver.hasOwnProperty('foreign')) receiver.foreign = true
  }
}

exports.receivers = receivers
