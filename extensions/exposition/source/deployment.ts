import assert from 'node:assert'
import { type Dependency, type Service } from '@toa.io/operations'
import { encode } from '@toa.io/generic'
import { type Annotation } from './Annotation'
import * as schemas from './schemas'
import { shortcuts } from './Directive'
import { components } from './Composition'
import { parse } from './RTD/syntax'
import { DELAY, PORT } from './HTTP'

export function deployment (_: unknown, annotation?: Annotation): Dependency {
  assert.ok(annotation !== undefined, 'Exposition context annotation is required')
  schemas.annotation.validate(annotation)

  const labels = components().labels

  const service: Service = {
    group: 'exposition',
    name: 'gateway',
    port: PORT,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    version: require('../package.json').version,
    variables: [],
    components: labels,
    ingress: { default: true, hosts: [] },
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
      value: encode(tree)
    })
  }

  const { debug, trace, authorities } = annotation

  service.ingress!.hosts = Object.values(authorities)
  service.ingress!.class = annotation.class
  service.ingress!.annotations = annotation.annotations

  const properties: Properties = { authorities }

  if (debug === true)
    properties.debug = true

  if (trace === true)
    properties.trace = true

  service.variables!.push({
    name: 'TOA_EXPOSITION_PROPERTIES',
    value: encode(properties)
  })

  return { services: [service] }
}

type Properties = Pick<Annotation, 'authorities' | 'debug' | 'trace'>
