import { type Dependency, type Service } from '@toa.io/operations'
import { type Annotation } from './Annotation.js'
import * as schemas from './schemas.js'
import { shortcuts } from './shortcuts.js'
import { components } from './components.js'
import { parse } from './syntax/index.js'
import { DELAY, PORT, PROBE } from './const.js'
import { version } from '../version.js'

/** Where Toa's release publishes this service's image. An application takes it
 *  instead of building one when its context says `registry.services: published`. */
export const image = 'ghcr.io/toa-io/extension-exposition-gateway'

export function deployment(_: unknown, annotation?: Annotation): Dependency {
  if (annotation === undefined)
    throw new Error('Exposition context annotation is required')
  schemas.annotation.validate(annotation)

  const labels = components().labels

  const service: Service = {
    group: 'exposition',
    name: 'gateway',
    image,
    port: PORT,
    version,
    variables: [],
    components: labels,
    resources: annotation.resources,
    ingress: { path: '/', hosts: [] },
    probe: {
      path: '/.ready',
      port: PROBE,
      delay: DELAY
    }
  }

  if (annotation?.['/'] !== undefined) {
    const tree = parse(annotation['/'], shortcuts)

    service.variables!.push({
      name: 'TOA_EXPOSITION',
      value: JSON.stringify(tree)
    })
  }

  const { debug, authorities } = annotation

  service.ingress!.hosts = Object.values(authorities)

  // leaving these undefined lets the context's own ingress section supply them
  if (annotation.class !== undefined) service.ingress!.class = annotation.class

  if (annotation.annotations !== undefined)
    service.ingress!.annotations = annotation.annotations

  if (annotation.service?.annotations !== undefined)
    service.annotations = annotation.service.annotations

  const properties: Properties = { authorities }

  if (debug === true) properties.debug = true

  if (annotation.protocol !== undefined) properties.protocol = annotation.protocol

  if (annotation.ip !== undefined) properties.ip = annotation.ip

  if (annotation.bouncer !== undefined) properties.bouncer = annotation.bouncer

  if (annotation.censor !== undefined) properties.censor = annotation.censor

  if (annotation.oauth !== undefined) properties.oauth = annotation.oauth

  if (annotation.rpc !== undefined) properties.rpc = annotation.rpc

  if (annotation.mcp !== undefined) properties.mcp = annotation.mcp

  service.variables!.push({
    name: 'TOA_EXPOSITION_PROPERTIES',
    value: JSON.stringify(properties)
  })

  // The identity composition nested in this process connects before route discovery settles,
  // so telemetry's probe — which tracks that composition — would report ready too early.
  // The gateway answers for itself, on the same port telemetry would have used.
  service.variables!.push({
    name: 'TOA_TELEMETRY_READY',
    value: JSON.stringify(false)
  })

  return { services: [service] }
}

type Properties = Pick<
  Annotation,
  'authorities' | 'debug' | 'protocol' | 'bouncer' | 'censor' | 'ip' | 'oauth' | 'rpc' | 'mcp'
>
