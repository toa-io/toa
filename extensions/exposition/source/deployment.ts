import assert from 'node:assert'
import { type Dependency, type Service } from '@toa.io/operations'
import { type Annotation } from './Annotation.js'
import * as schemas from './schemas.js'
import { shortcuts } from './Directive.js'
import { components } from './Composition.js'
import { parse } from './RTD/syntax/index.js'
import { DELAY, PORT } from './HTTP/index.js'

export function deployment (_: unknown, annotation?: Annotation): Dependency {
  assert.ok(annotation !== undefined, 'Exposition context annotation is required')
  schemas.annotation.validate(annotation)

  const labels = components().labels

  const service: Service = {
    group: 'exposition',
    name: 'gateway',
    port: PORT,
    version: require('../package.json').version,
    variables: [],
    components: labels,
    resources: annotation.resources,
    ingress: { path: '/', hosts: [] },
    probe: {
      path: '/.ready',
      port: PORT,
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
  if (annotation.class !== undefined)
    service.ingress!.class = annotation.class

  if (annotation.annotations !== undefined)
    service.ingress!.annotations = annotation.annotations

  const properties: Properties = { authorities }

  if (debug === true)
    properties.debug = true

  service.variables!.push({
    name: 'TOA_EXPOSITION_PROPERTIES',
    value: JSON.stringify(properties)
  })

  // Nested identity composition shares this process; gateway already exposes /.ready.
  service.variables!.push({
    name: 'TOA_TELEMETRY_READY',
    value: JSON.stringify(false)
  })

  return { services: [service] }
}

type Properties = Pick<Annotation, 'authorities' | 'debug'>
