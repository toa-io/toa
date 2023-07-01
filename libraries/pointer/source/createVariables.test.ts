import { generate } from 'randomstring'
import { createVariables } from './createVariables'
import type { Variables } from '@toa.io/operations'
import type { Request } from './Deployment'

it('should create from selector', async () => {
  const id = generate()
  const selector = generate()
  const annotation = { [selector]: uri() }
  const request: Request = { group: generate(), selectors: [selector] }
  const variables = createVariables(id, annotation, [request])

  const expectation: Variables = {
    [request.group]: [{
      name: `TOA_${id.toUpperCase()}_${selector.toUpperCase()}`,
      value: annotation[selector]
    }]
  }

  expect(variables)
    .toStrictEqual(expectation)
})

it('should create from partial match', async () => {
  const id = generate()
  const key = generate()
  const selector = `${key}.${generate()}`
  const annotation = { [key]: uri() }
  const request: Request = { group: generate(), selectors: [selector] }
  const variables = createVariables(id, annotation, [request])

  const expectation: Variables = {
    [request.group]: [{
      name: `TOA_${id.toUpperCase()}_${
        selector
          .replace('.', '_')
          .toUpperCase()
      }`,
      value: annotation[key]
    }]
  }

  expect(variables)
    .toStrictEqual(expectation)
})

it('should create from default', async () => {
  const id = generate()
  const annotation = uri()
  const selector = generate()
  const request: Request = { group: generate(), selectors: [selector] }
  const variables = createVariables(id, annotation, [request])

  const expectation: Variables = {
    [request.group]: [{
      name: `TOA_${id.toUpperCase()}_${selector.toUpperCase()}`,
      value: annotation
    }]
  }

  expect(variables)
    .toStrictEqual(expectation)
})

it('should create from array', async () => {
  const id = generate()
  const selector = generate()
  const values = [uri(), uri()]
  const annotation = { [selector]: values }
  const request: Request = { group: generate(), selectors: [selector] }
  const variables = createVariables(id, annotation, [request])

  const expectation: Variables = {
    [request.group]: [{
      name: `TOA_${id.toUpperCase()}_${selector.toUpperCase()}`,
      value: values.join(' ')
    }]
  }

  expect(variables)
    .toStrictEqual(expectation)
})

it('should create from default array', async () => {
  const id = generate()
  const selector = generate()
  const values = [uri(), uri()]
  const annotation = values
  const request: Request = { group: generate(), selectors: [selector] }
  const variables = createVariables(id, annotation, [request])

  const expectation: Variables = {
    [request.group]: [{
      name: `TOA_${id.toUpperCase()}_${selector.toUpperCase()}`,
      value: values.join(' ')
    }]
  }

  expect(variables)
    .toStrictEqual(expectation)
})

it('should throw if selector cannot be resolved', async () => {
  const id = generate()
  const selector = generate()
  const annotation = {}
  const request: Request = { group: generate(), selectors: [selector] }

  expect(() => createVariables(id, annotation, [request]))
    .toThrow('cannot be resolved.')
})

function uri (): string {
  return 'http://host-' + generate()
}
