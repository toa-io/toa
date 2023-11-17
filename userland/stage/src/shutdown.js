'use strict'

const { state } = require('./state')
const { binding } = require('./binding')

/** @type {toa.stage.Shutdown} */
const shutdown = async () => {
  const components = state.components.map((component) => component.disconnect())
  const compositions = state.compositions.map((composition) => composition.disconnect())
  const services = state.services.map((service) => service.disconnect())
  const remotes = state.remotes.map((remote) => remote.disconnect())
  const disconnections = [...components, ...compositions, ...services, ...remotes]

  await Promise.all(disconnections)

  state.reset()
  binding.reset()
}

exports.shutdown = shutdown
