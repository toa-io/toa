import { type Dependency } from '@toa.io/operations'
import { type Declaration, normalize } from './annotation.js'
import * as sources from './sources.js'
import { type Instance } from './instance.js'

export function deployment (instances: Instance[], declaration: Declaration): Dependency {
  const annotation = normalize(declaration)

  return sources.createDependency(annotation.sources, instances)
}
