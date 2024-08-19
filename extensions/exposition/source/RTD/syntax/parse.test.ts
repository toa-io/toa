import { parse } from './parse'

describe('routes', () => {
  it('should parse route', async () => {
    const declaration = {
      '/': {},
      '/foo': {}
    }

    const node = parse(declaration)

    expect(node.routes).toHaveLength(2)
    expect(node.routes[0].path).toBe('/')
    expect(node.routes[1].path).toBe('/foo')
  })

  it('should parse nested routes', async () => {
    const declaration = {
      '/': {
        '/foo': {},
        '/bar': {}
      }
    }

    const node = parse(declaration)
    const root = node.routes[0].node

    expect(root.routes).toHaveLength(2)
    expect(root.routes[0].path).toBe('/foo')
    expect(root.routes[1].path).toBe('/bar')
  })
})

describe('methods', () => {
  it('should parse methods', () => {
    const declaration = {
      '/': {
        GET: {
          endpoint: 'observe'
        }
      }
    }

    const node = parse(declaration)
    const root = node.routes[0].node

    expect(root.methods).toHaveLength(1)
    expect(root.methods[0].verb).toBe('GET')
    expect(root.methods[0].mapping).toMatchObject({ endpoint: 'observe' })
  })

  it('should parse endpoint shortcut', async () => {
    const declaration = {
      '/': {
        GET: 'observe'
      }
    }

    const node = parse(declaration)
    const root = node.routes[0].node

    expect(root.methods).toHaveLength(1)
    expect(root.methods[0].verb).toBe('GET')
    expect(root.methods[0].mapping).toMatchObject({ endpoint: 'observe' })
  })

  it('should parse fq endpoint', async () => {
    const declaration = {
      '/': {
        GET: 'dummies.dummy.observe'
      }
    }

    const node = parse(declaration)
    const root = node.routes[0].node

    expect(root.methods).toHaveLength(1)
    expect(root.methods[0].verb).toBe('GET')

    expect(root.methods[0].mapping).toMatchObject({
      namespace: 'dummies',
      component: 'dummy',
      endpoint: 'observe'
    })
  })

  it('should parse fq endpoint within default namespace', async () => {
    const declaration = {
      '/': {
        GET: 'dummy.observe'
      }
    }

    const node = parse(declaration)
    const root = node.routes[0].node

    expect(root.methods).toHaveLength(1)
    expect(root.methods[0].verb).toBe('GET')

    expect(root.methods[0].mapping).toMatchObject({
      namespace: 'default',
      component: 'dummy',
      endpoint: 'observe'
    })
  })

  it('should parse directives', async () => {
    const declaration = {
      '/': {
        GET: {
          'auth:incept': 'id',
          endpoint: 'observe'
        }
      }
    }

    const node = parse(declaration)
    const root = node.routes[0].node

    expect(root.methods[0].directives)
      .toStrictEqual([{ family: 'auth', name: 'incept', value: 'id' }])
  })
})

describe('directives', () => {
  it('should parse shortcuts', async () => {
    const declaration = {
      '/': {
        foo: 'baz'
      }
    }

    const shortcuts = new Map<string, string>([
      ['foo', 'dev:foo']
    ])

    const node = parse(declaration, shortcuts)
    const root = node.routes[0].node

    expect(root.directives).toHaveLength(1)
    expect(root.directives[0].family).toBe('dev')
    expect(root.directives[0].name).toBe('foo')
    expect(root.directives[0].value).toBe('baz')
  })
})

describe('validation', () => {
  it('should throw on unknown key', async () => {
    const declaration = { hello: 'world' }

    expect(() => parse(declaration)).toThrow('RTD parse error: unknown key \'hello\'')
  })

  it('should throw on invalid mapping', async () => {
    const declaration = {
      '/': {
        GET: {
          endpoint: 'observe',
          hello: 'world'
        }
      }
    }

    expect(() => parse(declaration)).toThrow('/methods/0/mapping')
  })
})

it('should expand ranges', async () => {
  const declaration = {
    '/': {
      GET: {
        endpoint: 'enumerate',
        query: {
          omit: 3,
          limit: 2
        }
      }
    }
  }

  const node = parse(declaration)
  const query = node.routes[0].node.methods[0].mapping?.query

  expect(query).toMatchObject({
    omit: { value: 3, range: [3, 3] },
    limit: { value: 2, range: [2, 2] }
  })
})
