import { readFileSync } from 'node:fs'
import { options } from './annotation.js'
import { components } from './Composition.js'
import { ENV, UI_PATH, UI_PORT } from './const.js'
import * as schemas from './schemas.js'
import type { Annotation } from './annotation.js'
import type { Dependency, Instances, Service } from '@toa.io/operations'

export const standalone = true

/**
 * The explorer hosts the introspection components, exactly as the exposition
 * gateway hosts the identity ones. Collection is on unless the context says
 * `introspection: false`, and the environment variable is emitted together
 * with the service — never on its own, or tasks would pile up in a queue
 * nothing consumes.
 */
export function deployment (_: Instances<unknown>, annotation?: Annotation): Dependency {
  if (annotation === false)
    return {}

  if (annotation !== undefined)
    schemas.annotation.validate(annotation)

  const opts = options(annotation)

  const service: Service = {
    group: 'introspection',
    name: 'explorer',
    version: JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version,
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
