import { components as digest, type Components } from '../digest/read.ts'
import { ENCOUNTERS, NAMESPACE } from './const.ts'
import type { Annotation } from './types.ts'

/**
 * The components this extension ships, which run inside its own service: the encounters only
 * where the annotation serves them.
 */
export function components(annotation?: Partial<Annotation>): Components {
  return digest(
    'extensions.chronicles',
    (label) => annotation?.encounters === true || label !== `${NAMESPACE}-${ENCOUNTERS}`
  )
}
