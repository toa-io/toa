import { components as digest, type Components } from '../digest/read.ts'
import type { Annotation } from './annotation.ts'
import { NAMESPACE, SIGNALS } from './const.ts'

const SIGNALS_LABEL = `${NAMESPACE}-${SIGNALS}`

/**
 * The extension is predefined, so an application that turns introspection off
 * must not end up with the explorer components — nor with the exposition
 * dependency they bring in.
 */
export function components(annotation?: Annotation): Components {
  if (annotation === false) return { labels: [], manifests: [] }

  const components = digest('extensions.introspection')

  if (annotation !== undefined && annotation.halt === true) return components

  /*
   * A deployment that has not asked for halts has nothing to post one to. What the component
   * is reachable over is HTTP, and what it does is stop the whole deployment, so it is not a
   * thing to deploy and leave unlistened to.
   */
  const index = components.labels.indexOf(SIGNALS_LABEL)

  if (index === -1) return components

  return {
    labels: components.labels.filter((_, n) => n !== index),
    manifests: components.manifests.filter((_, n) => n !== index)
  }
}
