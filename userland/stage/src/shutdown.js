import { state } from './state.js'
import { map } from './map.js'

/** @type {toa.stage.Shutdown} */
export const shutdown = async () => {
  const components = state.components.map((component) => component.disconnect())
  const compositions = state.compositions.map((composition) => composition.disconnect())
  const workloads = state.workloads.map((workload) => workload.disconnect())
  const services = state.services.map((service) => service.disconnect())
  const remotes = state.remotes.map((remote) => remote.disconnect())
  const disconnections = [
    ...components,
    ...compositions,
    ...workloads,
    ...services,
    ...remotes
  ]

  await Promise.all(disconnections)

  // whatever a test stated is not carried into the next one
  map(undefined)

  state.reset()
}
