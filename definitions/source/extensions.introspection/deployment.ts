import { options } from './annotation.js'
import { components } from './components.js'
import { version } from '../version.js'
import { ENV, UI_PATH, UI_PORT } from './const.js'
import * as schemas from './schemas.js'
import type { Annotation } from './annotation.js'
import type { Dependency, Instances, Service } from '@toa.io/operations'

/** Where Toa's release publishes this service's image. An application takes it
 *  instead of building one when its context says `registry.services: published`. */
export const image = 'ghcr.io/toa-io/extension-introspection-explorer'

export const standalone = true

/**
 * The explorer hosts the introspection components, exactly as the exposition
 * gateway hosts the identity ones. Collection is on unless the context says
 * `introspection: false`, and the environment variable is emitted together
 * with the service — never on its own, or tasks would pile up in a queue
 * nothing consumes.
 */
export function deployment(_: Instances<unknown>, annotation?: Annotation): Dependency {
  if (annotation === false) return {}

  if (annotation !== undefined) schemas.annotation.validate(annotation)

  const opts = options(annotation)

  const service: Service = {
    group: 'introspection',
    name: 'explorer',
    image,
    version,
    components: components().labels,
    resources: annotation?.resources,
    variables: []
  }

  if (opts.ui) {
    service.port = UI_PORT
    service.ingress = { path: UI_PATH }
  }

  return {
    services: [service],
    variables: { global: [{ name: ENV, value: JSON.stringify(opts) }] }
  }
}
