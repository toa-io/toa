import { type Dependency } from '@toa.io/operations'
import { type Declaration, normalize } from './annotation.ts'
import { VARIABLE } from './const.ts'

/**
 * The map every process reads, both to dial a component and to know the port it listens on for
 * the components it serves. It deploys nothing: a component answers on the `Service` rendered
 * for it, which is where an unstated address resolves to.
 */
export function deployment(_: unknown, declaration?: Declaration): Dependency {
  const annotation = declaration === undefined ? {} : normalize(declaration)

  return { variables: { global: [{ name: VARIABLE, value: JSON.stringify(annotation) }] } }
}
