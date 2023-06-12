import { validate, methods, Exception, type Node } from './syntax'
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

  it('should not throw on root node', async () => {
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

  it('should not throw on empty key', async () => {
    const node: Node = {
      '/foo': {
        '/': {
          '/bar': {}
        },
        '/baz': {}
      }
    }

    expect(() => validate(node, operations)).not.toThrow()
  })

  it('should throw on methods of the top-level node', async () => {
    const node: Node = {
      GET: {
        operation: 'observe',
        type: 'observation'
      },
      '/foo': {}
    }

    expect(() => validate(node, operations)).toThrow('must NOT have additional properties')
  })

  it('should throw on unreachable methods', async () => {
    const node: Node = {
      '/foo': {
        GET: {
          operation: 'observe',
          type: 'observation'
        },
        '/': {
          GET: {
            operation: 'observe',
            type: 'observation'
          }
        }
      }
    }

    expect(() => validate(node, operations)).toThrow('unreachable')
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

  it('should not allow trailing slash in nested nodes', async () => {
    const node: Node = {
      '/foo': {
        GET: { operation: 'observe', type: 'observation' },
        '/bar/': {}
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

    expect(() => validate(node, operations)).toThrow('must have required property \'operation\'')
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

describe('exception', () => {
  it('should add prefix', async () => {
    const message = generate()
    const exception = new Exception(message)

    expect(exception.message).toStrictEqual('RTD syntax error: ' + message)
  })
})
