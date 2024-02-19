import assert from 'node:assert'
import { providers } from './providers'
import * as schemas from './schemas'
import type { Declaration } from './providers'
import type { Schema } from '@toa.io/schemas'

export type Annotation = Record<string, Declaration>

export function validateAnnotation (annotation: unknown): asserts annotation is Annotation {
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
function explain (annotation: unknown): void {
  assert.ok(typeof annotation === 'object' && annotation !== null,
    'TOA_STORAGES is not an object')

  for (const declaration of Object.values(annotation)) {
    assert.ok(typeof declaration === 'object' && declaration !== null &&
      declaration.provider in providers,
      `Unknown provider '${declaration.provider}'`)

    assert.ok(declaration.provider in schemas,
      `No schema for provider '${declaration.provider}'`)

    const schema: Schema<Declaration> = schemas[declaration.provider as keyof typeof providers]

    schema.validate(declaration, `Storage '${declaration.provider}' annotation`)
  }
}
