'use strict'

const { stage } = require('./stage')

/** @type {toa.userland.staging.Shutdown} */
const shutdown = async () => {
  const components = stage.components.map((component) => component.disconnect())
  const compositions = stage.compositions.map((composition) => composition.disconnect())
  const remotes = stage.remotes.map((remote) => remote.disconnect())
  const disconnections = [...components, ...compositions, ...remotes]

  await Promise.all(disconnections)

  stage.reset()
}

exports.shutdown = shutdown
