import { type Dependency } from '@toa.io/operations'
import { merge } from '@toa.io/generic'
import { type Declaration, normalize } from './annotation.js'
import * as sources from './sources.js'
import * as context from './context.js'
import { type Instance } from './instance.js'

export function deployment(instances: Instance[], declaration: Declaration): Dependency {
  const annotation = normalize(declaration)
  const contextDependency = context.createDependency(annotation.context)
  const sourcesDependency = sources.createDependency(annotation.sources, instances)

  return merge(contextDependency, sourcesDependency)
}
