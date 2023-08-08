import { generate } from 'randomstring'
import { type Annotation, normalize } from './annotation'

it('should expand string', async () => {
  const declaration = generate()
  const annotation = normalize(declaration)

  expect(annotation).toStrictEqual({
    context: {
      '.': declaration
    }
  })
})

it('should expand context default', async () => {
  const declaration = { context: generate() }
  const annotation = normalize(declaration)

  expect(annotation).toStrictEqual({
    context: {
      '.': declaration.context
    }
  })
})

it('should expand context with sources', async () => {
  const declaration = { context: generate(), sources: { foo: generate() } }
  const annotation = normalize(declaration)

  expect(annotation).toStrictEqual({
    context: {
      '.': declaration.context
    },
    sources: declaration.sources
  })
})

it('should validate', async () => {
  const declaration = { foo: 'bar' } as unknown as Annotation

  expect(() => normalize(declaration)).toThrow()
})
