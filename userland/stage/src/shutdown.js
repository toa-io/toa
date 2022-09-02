'use strict'

const { state } = require('./state')

/** @type {toa.stage.Shutdown} */
const shutdown = async () => {
  const components = state.components.map((component) => component.disconnect())
  const compositions = state.compositions.map((composition) => composition.disconnect())
  const remotes = state.remotes.map((remote) => remote.disconnect())
  const disconnections = [...components, ...compositions, ...remotes]

  await Promise.all(disconnections)

  state.reset()
}

exports.shutdown = shutdown
