import { generate } from 'randomstring'
import { normalize } from './declaration'
import * as fixtures from './declaration.fixtures'
import type { Manifest } from '@toa.io/norm'
import type { Node } from './declaration'
import type * as syntax from './syntax'

it('should be', async () => {
  expect(normalize).toBeInstanceOf(Function)
})

let manifest: Manifest
let namespace: string
let component: string

beforeEach(() => {
  manifest = fixtures.manifest()
  namespace = manifest.namespace
  component = manifest.name
})

it('should add namespace, component', async () => {
  const declaration: Node = {
    '/': {
      GET: {
        endpoint: 'observe'
      }
    }
  }

  const node = normalize(declaration, manifest)

  expect(node).toStrictEqual({
    '/': {
      GET: {
        namespace,
        component,
        endpoint: 'observe',
        type: 'observation'
      }
    }
  })
})

it('should expand operation shortcuts', async () => {
  const declaration: Node = {
    '/': {
      GET: 'observe'
    }
  }

  const node = normalize(declaration, manifest)

  expect(node).toStrictEqual({
    '/': {
      GET: {
        namespace,
        component,
        endpoint: 'observe',
        type: 'observation'
      }
    }
  })
})

it('should expand operation shortcuts in nested Routes', async () => {
  const declaration: Node = {
    '/': {
      '/dummies': {
        GET: 'observe'
      }
    }
  }

  const node = normalize(declaration, manifest)

  expect(node).toStrictEqual({
    '/': {
      '/dummies': {
        GET: {
          namespace,
          component,
          endpoint: 'observe',
          type: 'observation'
        }
      }
    }
  })
})

it('should expand method shortcuts', async () => {
  const declaration: Node = {
    '/': {
      '/dummies': 'observe'
    }
  }

  const node = normalize(declaration, manifest)

  expect(node).toStrictEqual({
    '/': {
      '/dummies': {
        GET: {
          namespace,
          component,
          endpoint: 'observe',
          type: 'observation'
        }
      }
    }
  })
})

it('should throw on unsupported type', async () => {
  const declaration: Node = {
    '/': {
      '/dummies': ['observe', 'assign']
    }
  }

  const node = normalize(declaration, manifest)

  expect(node).toStrictEqual({
    '/': {
      '/dummies': {
        GET: {
          namespace,
          component,
          endpoint: 'observe',
          type: 'observation'
        },
        PATCH: {
          namespace,
          component,
          endpoint: 'assign',
          type: 'assignment'
        }
      }
    }
  } satisfies syntax.Node)
})

it('should throw on ambiguous method shortcuts', async () => {
  const declaration: Node = {
    '/': {
      '/dummies': 'transit'
    }
  }

  expect(() => normalize(declaration, manifest)).toThrow('Ambiguous mapping')
})

it('should throw on undefined method shortcuts', async () => {
  const declaration: Node = {
    '/': {
      '/dummies': generate()
    }
  }

  expect(() => normalize(declaration, manifest)).toThrow('is not defined')
})
