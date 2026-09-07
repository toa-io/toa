import { components as digest, type Components } from '../digest/read.js'
import type { Annotation } from './annotation.js'

/**
 * The extension is predefined, so an application that turns introspection off
 * must not end up with the explorer components — nor with the exposition
 * dependency they bring in.
 */
export function components(annotation?: Annotation): Components {
  if (annotation === false) return { labels: [], manifests: [] }

  return digest('extensions.introspection')
}
