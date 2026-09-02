import { it } from 'node:test'
import assert from 'node:assert/strict'

import { generate } from 'randomstring'
import { normalize } from './annotation.js'

it('should expand string', async () => {
  const declaration = uri()
  const annotation = normalize(declaration)

  assert.partialDeepStrictEqual(annotation, {
    context: {
      '.': [declaration]
    }
  })
})

it('should expand context default', async () => {
  const declaration = { context: uri() }
  const annotation = normalize(declaration)

  assert.partialDeepStrictEqual(annotation, {
    context: {
      '.': [declaration.context]
    }
  })
})

it('should expand context with sources', async () => {
  const declaration = { context: uri(), sources: { foo: [uri()] } }
  const annotation = normalize(declaration)

  assert.partialDeepStrictEqual(annotation, {
    context: {
      '.': [declaration.context]
    },
    sources: declaration.sources
  })
})

function uri (): string {
  return 'http://host-' + generate()
}
