import { component } from './annotation'
import * as schemas from './schemas'
import type { Declaration } from './annotation'

/**
 * The component level of the annotation.
 *
 * The extension is predefined, so most components say nothing and the
 * declaration arrives as `null` — which still has to produce a value,
 * or norm rejects the extension.
 */
export function manifest (declaration: Declaration | null | undefined): Declaration {
  const normalized = component(declaration)

  if (normalized !== false)
    schemas.declaration.validate(normalized)

  return normalized
}
