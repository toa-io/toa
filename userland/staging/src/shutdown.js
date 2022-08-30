'use strict'

const { stage } = require('./stage')

/** @type {toa.userland.staging.Shutdown} */
const shutdown = async () => {
  const disconnections = stage.components.map((component) => component.disconnect())

  await Promise.all(disconnections)

  stage.reset()
}

exports.shutdown = shutdown
