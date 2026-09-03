import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { parse } from './parse.js'

describe('routes', () => {
  it('should parse route', async () => {
    const declaration = {
      '/': {},
      '/foo': {}
    }

    const node = parse(declaration)

    assert.strictEqual(node.routes.length, 2)
    assert.strictEqual(node.routes[0].path, '/')
    assert.strictEqual(node.routes[1].path, '/foo')
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

    assert.strictEqual(root.routes.length, 2)
    assert.strictEqual(root.routes[0].path, '/foo')
    assert.strictEqual(root.routes[1].path, '/bar')
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

    assert.strictEqual(root.methods.length, 1)
    assert.strictEqual(root.methods[0].verb, 'GET')
    assert.partialDeepStrictEqual(root.methods[0].mapping, { endpoint: 'observe' })
  })

  it('should parse endpoint shortcut', async () => {
    const declaration = {
      '/': {
        GET: 'observe'
      }
    }

    const node = parse(declaration)
    const root = node.routes[0].node

    assert.strictEqual(root.methods.length, 1)
    assert.strictEqual(root.methods[0].verb, 'GET')
    assert.partialDeepStrictEqual(root.methods[0].mapping, { endpoint: 'observe' })
  })

  it('should parse fq endpoint', async () => {
    const declaration = {
      '/': {
        GET: 'dummies.dummy.observe'
      }
    }

    const node = parse(declaration)
    const root = node.routes[0].node

    assert.strictEqual(root.methods.length, 1)
    assert.strictEqual(root.methods[0].verb, 'GET')

    assert.partialDeepStrictEqual(root.methods[0].mapping, {
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

    assert.strictEqual(root.methods.length, 1)
    assert.strictEqual(root.methods[0].verb, 'GET')

    assert.partialDeepStrictEqual(root.methods[0].mapping, {
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

    assert.deepStrictEqual(root.methods[0].directives, [{ family: 'auth', name: 'incept', value: 'id' }])
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

    assert.strictEqual(root.directives.length, 1)
    assert.strictEqual(root.directives[0].family, 'dev')
    assert.strictEqual(root.directives[0].name, 'foo')
    assert.strictEqual(root.directives[0].value, 'baz')
  })
})

describe('validation', () => {
  it('should throw on unknown key', async () => {
    const declaration = { hello: 'world' }

    assert.throws(() => parse(declaration), (error: any) => /RTD parse error: unknown key 'hello'/.test(error.message))
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

    assert.throws(() => parse(declaration), (error: any) => /\/methods\/0\/mapping/.test(error.message))
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

  assert.partialDeepStrictEqual(query, {
    omit: { value: 3, range: [3, 3] },
    limit: { value: 2, range: [2, 2] }
  })
})
