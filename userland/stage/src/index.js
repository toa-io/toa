import { manifest } from './manifest.js'
import { component } from './component.js'
import { composition } from './composition.js'
import { workload } from './workload.js'
import { service } from './service.js'
import { remote } from './remote.js'
import { shutdown } from './shutdown.js'

export {
  manifest,
  component,
  composition,
  composition as compose,
  workload,
  service as serve,
  remote,
  shutdown
}
