import type { Declaration } from './annotation.ts'

/**
 * The component level of the annotation. A component is on the map, or it says
 * `introspection: false`, and there is nothing else for it to declare.
 *
 * The extension is predefined, so most components say nothing and the
 * declaration arrives as `null` — which still has to produce a value,
 * or norm rejects the extension.
 */
export function manifest(declaration: Declaration | null | undefined): Declaration {
  return declaration === false ? false : {}
}
