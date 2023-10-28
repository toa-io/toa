import { generate } from 'randomstring'
import { normalize } from './annotation'

it('should expand string', async () => {
  const declaration = uri()
  const annotation = normalize(declaration)

  expect(annotation).toMatchObject({
    context: {
      '.': [declaration]
    }
  })
})

it('should expand context default', async () => {
  const declaration = { context: uri() }
  const annotation = normalize(declaration)

  expect(annotation).toMatchObject({
    context: {
      '.': [declaration.context]
    }
  })
})

it('should expand context with sources', async () => {
  const declaration = { context: uri(), sources: { foo: [uri()] } }
  const annotation = normalize(declaration)

  expect(annotation).toMatchObject({
    context: {
      '.': [declaration.context]
    },
    sources: declaration.sources
  })
})

function uri (): string {
  return 'http://host-' + generate()
}
