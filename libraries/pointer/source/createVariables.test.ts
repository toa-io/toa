import { generate } from 'randomstring'
import { Annotation } from '@toa.io/extensions.origins/transpiled/annotation'
import { createVariables } from './createVariables'
import type { Variable, Variables } from '@toa.io/operations'
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

it('should create credential secrets for annotation keys', async () => {
  const id = generate()

  const group = generate()
  const namespace = generate()
  const name1 = 'one'
  const name2 = 'two'
  const name3 = 'three'
  const selector1 = `${namespace}.${name1}`
  const selector2 = `${namespace}.${name2}`
  const selector3 = `${generate()}.${name3}`

  const annotation = {
    '.': uri('amqp:'),
    [namespace]: uri('amqp:'),
    [selector1]: uri('amqp:')
  }

  const request: Request = { group, selectors: [selector1, selector2, selector3] }
  const variables = createVariables(id, annotation, [request])

  const secrets1 = createExpectedSecrets(id, selector1, selector1)
  const secrets2 = createExpectedSecrets(id, namespace, selector2)
  const secrets3 = createExpectedSecrets(id, '.', selector3)

  const expectation: Variables = {
    [group]: expect.arrayContaining([
      ...secrets1,
      ...secrets2,
      ...secrets3
    ])
  }

  expect(variables).toStrictEqual(expectation)
})

it.each([
  'http:', 'redis:'
])('should not create credetial secrets for %s', async (protocol) => {
  const id = generate()
  const selector = generate()
  const annotation = { [selector]: uri(protocol) }
  const request: Request = { group: generate(), selectors: [selector] }
  const variables = createVariables(id, annotation, [request])

  for (const variable of variables[request.group])
    expect(variable.secret).toBeUndefined()
})

function uri (protocol = 'http:'): string {
  return protocol + '//host-' + generate()
}

function createExpectedSecrets (id: string, key: string, selector: string): Variable[] {
  key = key === '.' ? '.default' : '-' + key.replaceAll('.', '-')
  selector = selector.replaceAll('.', '_').toUpperCase()

  return [
    {
      name: `TOA_${id.toUpperCase()}_${selector.toUpperCase()}_USERNAME`,
      secret: {
        name: `toa-${id}${key}`,
        key: 'username'
      }
    },
    {
      name: `TOA_${id.toUpperCase()}_${selector.toUpperCase()}_PASSWORD`,
      secret: {
        name: `toa-${id}${key}`,
        key: 'password'
      }
    }
  ]
}
