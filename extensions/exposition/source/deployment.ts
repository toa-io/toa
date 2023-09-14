import { type Dependency, type Service } from '@toa.io/operations'
import { encode } from '@toa.io/generic'
import { type Annotation } from './Annotation'
import * as schemas from './schemas'
import { shortcuts } from './Directive'
import { components } from './Composition'
import { parse } from './RTD/syntax'

export function deployment (_: unknown, annotation: Annotation | undefined): Dependency {
  const labels = components().labels

  const service: Service = {
    group: 'exposition',
    name: 'gateway',
    port: 8000,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    version: require('../package.json').version,
    variables: [],
    components: labels
  }

  if (annotation?.host !== undefined)
    service.ingress = {
      host: annotation.host,
      class: annotation.class,
      annotations: annotation.annotations
    }

  if (annotation?.['/'] !== undefined) {
    annotation['/'] = parse(annotation['/'], shortcuts)

    service.variables.push({
      name: 'TOA_EXPOSITION',
      value: encode(annotation['/'])
    })
  }

  if (annotation !== undefined)
    schemas.annotaion.validate(annotation)

  return { services: [service] }
}
