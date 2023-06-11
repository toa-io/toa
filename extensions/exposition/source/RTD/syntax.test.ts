import { validate, methods, Node } from './syntax'
import { generate } from 'randomstring'
import type { Manifest } from '@toa.io/norm'

describe('validate', () => {
  const operations: Manifest['operations'] = {
    observe: {
      type: 'observation'
    }
  }

  it('should be', async () => {
    expect(validate).toBeInstanceOf(Function)
  })

  it('should not throw on valid node', async () => {
    const node: Node = {
      '/': {
        GET: {
          operation: 'observe',
          type: 'observation'
        }
      }
    }

    expect(() => validate(node, operations)).not.toThrow()
  })

  it('should not throw on non-root node', async () => {
    const node: Node = {
      '/foo': {
        GET: {
          operation: 'observe',
          type: 'observation'
        }
      }
    }

    expect(() => validate(node, operations)).not.toThrow()
  })

  it('should not allow trailing slash', async () => {
    const node: Node = {
      '/foo/': {
        GET: { operation: 'observe', type: 'observation' }
      }
    }

    expect(() => validate(node, operations)).toThrow('must NOT have additional properties')
  })

  it('should throw if invalid mapping', async () => {
    const node = {
      '/': {
        GET: {}
      }
    }

    expect(() => validate(node, operations)).toThrow('must have required property')
  })

  it('should throw on operation type mismatch', async () => {
    const node: Node = {
      '/': {
        GET: {
          operation: 'transit',
          type: 'transition'
        }
      }
    }

    expect(() => validate(node, operations)).toThrow('cannot be mapped')
  })

  it('should throw if maps to undefined operation', async () => {
    const node: Node = {
      '/': {
        GET: { operation: generate(), type: 'observation' }
      }
    }

    expect(() => validate(node, operations)).toThrow('is mapped to undefined operation')
  })
})

describe('methods', () => {
  it('should be', async () => {
    expect(methods).toBeInstanceOf(Set)
    expect(methods.size).toBeGreaterThan(0)
  })
})
