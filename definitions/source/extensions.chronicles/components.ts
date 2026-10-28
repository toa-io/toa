import { components as digest, type Components } from '../digest/read.ts'
import { ENCOUNTERS, NAMESPACE, QUERIES } from './const.ts'
import type { Annotation } from './types.ts'

/**
 * The components this extension ships, which run inside its own service: the encounters only
 * where the annotation serves them, and the queries unless it names no store to read.
 */
export function components(annotation?: Partial<Annotation>): Components {
  return digest('extensions.chronicles', (label) => {
    if (label === `${NAMESPACE}-${ENCOUNTERS}`) return annotation?.encounters === true
    if (label === `${NAMESPACE}-${QUERIES}`)
      return annotation === undefined || annotation.store !== undefined

    return true
  })
}
