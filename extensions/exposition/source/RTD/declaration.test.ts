import { normalize, Node } from './declaration'
import * as fixtures from './declaration.fixtures'
import { generate } from "randomstring"

import type { Manifest } from '@toa.io/norm'

it('should be', async () => {
  expect(normalize).toBeInstanceOf(Function)
})

let manifest: Partial<Manifest>

beforeEach(() => {
  manifest = fixtures.manifest()
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
        operation: 'observe'
      }
    }
  })
})

it('should throw on operation type mismatch', async () => {
  const declaration: Node = {
    '/': {
      GET: {
        operation: 'transit'
      }
    }
  }

  expect(() => normalize(declaration, manifest)).toThrow('cannot be mapped to')
})

it('should throw on undefined operation', async () => {
  const declaration: Node = {
    '/': {
      GET: generate()
    }
  }

  expect(() => normalize(declaration, manifest)).toThrow('is not defined')
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
          operation: 'observe'
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
          operation: 'observe'
        }
      }
    }
  })
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
