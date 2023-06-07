import { validate, methods, Node } from './syntax'

describe('validate', () => {
  it('should be', async () => {
    expect(validate).toBeInstanceOf(Function)
  })

  it('should not throw on valid node', async () => {
    const node: Node = {
      '/': {
        GET: {
          operation: 'observe'
        }
      }
    }

    expect(() => validate(node)).not.toThrow()
  })

  it('should throw if invalid mapping', async () => {
    const node = {
      '/': {
        GET: {}
      }
    }

    expect(() => validate(node)).toThrow('must have required property')
  })
})

describe('methods', () => {
  it('should be', async () => {
    expect(methods).toBeInstanceOf(Set)
    expect(methods.size).toBeGreaterThan(0)
  })
})
