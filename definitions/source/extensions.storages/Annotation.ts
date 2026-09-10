import { secrets } from './secrets.js'
import * as schemas from './schemas.js'
import type { Provider } from './secrets.js'
import type { Schema } from '@toa.io/schemas'

export type Annotation = Record<string, Declaration>

/** What a storage is declared as; what else it takes is the provider's, stated in its schema. */
export type Declaration = { provider: Provider } & Record<string, any>

export type { Provider }

export function validateAnnotation(
  annotation: unknown
): asserts annotation is Annotation {
  try {
    schemas.annotation.validate(annotation)
  } catch (error) {
    explain(annotation)

    // if all declarations are valid, re-throw the error
    throw error
  }
}

/*
It is required because `oneOf` schema is used for the annotation validation.
 */
function explain(annotation: unknown): void {
  if (!(typeof annotation === 'object' && annotation !== null))
    throw new Error('TOA_STORAGES is not an object')

  for (const declaration of Object.values(annotation)) {
    if (
      !(
        typeof declaration === 'object' &&
        declaration !== null &&
        declaration.provider in secrets
      )
    )
      throw new Error(`Unknown provider '${declaration.provider}'`)

    if (!(declaration.provider in schemas))
      throw new Error(`No schema for provider '${declaration.provider}'`)

    const provider = declaration.provider as Provider

    // the declaration names the provider
    // oxlint-disable-next-line import/namespace
    const schema: Schema<Declaration> = schemas[provider]

    schema.validate(declaration, `Storage '${declaration.provider}' annotation`)
  }
}
