'use strict'

const receivers = (component) => {
  if (component.receivers === undefined) return

  for (const receiver of Object.values(component.receivers)) {
    if (receiver.foreign === undefined) receiver.foreign = receiver.binding !== undefined
  }
}

exports.receivers = receivers
