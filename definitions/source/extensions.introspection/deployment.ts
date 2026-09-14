import { options } from './annotation.ts'
import { components } from './components.ts'
import { version } from '../version.ts'
import { ENV, NAMESPACE, UI_PATH, UI_PORT } from './const.ts'
import * as schemas from './schemas.ts'
import type { Annotation, Declaration } from './annotation.ts'
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
export function deployment(
  instances: Instances<Declaration>,
  annotation?: Annotation
): Dependency {
  if (annotation === false) return {}

  if (annotation !== undefined) schemas.annotation.validate(annotation)

  const opts = options(annotation)

  if (opts.halt) described(instances)

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

/**
 * A halt is decided by reading the map, so a component the map does not describe could be
 * called while the deployment is being declared still. With halts on, a component may be in
 * the map or opted out of it, and not both — it is told to choose rather than left with a
 * guarantee that quietly does not hold.
 */
function described(instances: Instances<Declaration>): void {
  const opted = instances
    .filter(
      ({ locator, manifest }) => manifest === false && locator.namespace !== NAMESPACE
    )
    .map(({ locator }) => locator.id)

  if (opted.length === 0) return

  throw new Error(
    `Components declaring 'introspection: false' cannot be deployed with ` +
      `'introspection.halt': ${opted.join(', ')}`
  )
}
