import { type Dependency } from '@toa.io/operations'
import { type Declaration, normalize } from './annotation'
import * as sources from './sources'
import { type Instance } from './instance'

export function deployment (instances: Instance[], declaration: Declaration): Dependency {
  const annotation = normalize(declaration)

  return sources.createDependency(annotation.sources, instances)
}
