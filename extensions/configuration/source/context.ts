import type { Manifest } from './manifest.js'
import type { Contribution } from '@toa.io/core/types'

/** What this extension puts on the context of a component that declares it. */
export function context (declaration: Manifest): Contribution {
  const contribution: Contribution = { name: 'configuration', schema: declaration.schema }

  // a value the schema declares a secret is one on the context, not a string
  if (JSON.stringify(declaration.schema).includes('"secret"'))
    contribution.imports = { '@toa.io/extensions.configuration': ['Secret'] }

  return contribution
}
