import { type Dependency } from '@toa.io/operations'
import { merge } from '@toa.io/generic'
import { type Declaration, normalize } from './annotation.ts'
import * as sources from './sources.ts'
import * as context from './context.ts'
import { type Instance } from './instance.ts'

export function deployment(instances: Instance[], declaration: Declaration): Dependency {
  const annotation = normalize(declaration)
  const contextDependency = context.createDependency(annotation.context)
  const sourcesDependency = sources.createDependency(annotation.sources, instances)

  return merge(contextDependency, sourcesDependency)
}
