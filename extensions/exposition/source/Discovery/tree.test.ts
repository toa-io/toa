import { describe as suite, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'

import { describe } from './tree.js'
import { Tree } from '../RTD/Tree.js'
import type * as http from '../HTTP/index.js'
import type { Introspection } from '../Introspection.js'
import type { EndpointsFactory } from '../Endpoint.js'
import type { DirectiveFactory } from '../RTD/Directives.js'
import type * as syntax from '../RTD/syntax/index.js'

/** A method with no mapping has no endpoint, so what it says is its directives' alone. */
const endpoints = {} as unknown as EndpointsFactory

/** What a method marked with this describes as, standing for a directive that refuses. */
const REFUSE = 'refuse'

const directives = {
  create: (stack: syntax.Directive[]) => ({
    declared: () => undefined,
    precall: async () => null,
    settle: async () => undefined,
    dispose: () => undefined,
    explain: async (_: unknown, introspection: Introspection) => {
      const mark = stack.find((directive) => directive.family === 'test')?.value

      if (mark === REFUSE) return null

      return mark === undefined ? introspection : { ...introspection, description: mark }
    }
  }),
  preflight: async () => undefined,
  depart: async () => undefined,
  dispose: () => undefined
} as unknown as DirectiveFactory

const method = (verb: string, mark?: string): syntax.Method => ({
  verb,
  directives: mark === undefined ? [] : [{ family: 'test', name: 'mark', value: mark }]
})

const node = (
  path: string,
  methods: syntax.Method[] = [],
  routes: syntax.Route[] = []
): syntax.Route => ({ path, node: { routes, methods, directives: [] } })

const trunk = (routes: syntax.Route[], methods: syntax.Method[] = []): syntax.Node => ({
  routes,
  methods,
  directives: []
})

const request = {} as unknown as http.Context

afterEach(() => {
  delete process.env.__TESTING_EXPOSITION_BRANCH_TTL
})

suite('discovery tree', () => {
  it('should key the trunk by the root', async () => {
    const tree = new Tree(trunk([], [method('GET')]), endpoints, directives)

    assert.deepEqual(Object.keys((await describe(tree, request)).routes), ['/'])
  })

  it('should key every route by the template it answers at', async () => {
    const tree = new Tree(
      trunk([
        node('/pots', [method('GET'), method('POST')], [node('/:id', [method('GET')])])
      ]),
      endpoints,
      directives
    )

    const { routes: resources } = await describe(tree, request)

    assert.deepEqual(Object.keys(resources), ['/pots', '/pots/:id'])
    assert.deepEqual(Object.keys(resources['/pots']), ['GET', 'POST'])
  })

  it('should include a route no name can spell', async () => {
    // `/.rpc` and `/.mcp` leave these out; HTTP addresses a route by its path
    const tree = new Tree(
      trunk([
        node('/v1.0', [method('GET')]),
        node('/files', [], [node('/**', [method('GET')])]),
        node('/any', [], [node('/*', [method('GET')])])
      ]),
      endpoints,
      directives
    )

    assert.deepEqual(Object.keys((await describe(tree, request)).routes), [
      '/any/*',
      '/files/**',
      '/v1.0'
    ])
  })

  it('should skip an intermediate node, whose route answers in its place', async () => {
    const tree = new Tree(
      trunk([node('/posts', [method('PATCH')], [node('/', [method('PUT')])])]),
      endpoints,
      directives
    )

    assert.deepEqual(Object.keys((await describe(tree, request)).routes), ['/posts'])
  })

  it('should omit a resource this caller may reach no method of', async () => {
    const tree = new Tree(
      trunk([
        node('/open', [method('GET')]),
        node('/closed', [method('GET', REFUSE), method('POST', REFUSE)])
      ]),
      endpoints,
      directives
    )

    assert.deepEqual(Object.keys((await describe(tree, request)).routes), ['/open'])
  })

  it('should carry only the verbs this caller may reach', async () => {
    const tree = new Tree(
      trunk([node('/pots', [method('GET'), method('POST', REFUSE)])]),
      endpoints,
      directives
    )

    const { routes: resources } = await describe(tree, request)

    assert.deepEqual(Object.keys(resources['/pots']), ['GET'])
  })

  it('should answer the declaration a request would reach where two share a template', async () => {
    // `/a/b` and `/a: { /b: }` are two routes and one template; the more specific matches
    const tree = new Tree(
      trunk([
        node('/a/b', [method('GET', 'nested')]),
        node('/a', [], [node('/b', [method('GET', 'adjacent')])])
      ]),
      endpoints,
      directives
    )

    const { routes: resources } = await describe(tree, request)

    assert.deepEqual(Object.keys(resources), ['/a/b'])
    assert.equal(resources['/a/b'].GET.description, 'nested')
  })

  it('should drop a branch that has expired', async () => {
    process.env.__TESTING_EXPOSITION_BRANCH_TTL = '-1'

    const tree = new Tree(trunk([]), endpoints, directives)

    tree.merge(trunk([node('/pots', [method('GET')])]), {
      namespace: 'default',
      component: 'pots'
    })

    assert.deepEqual(Object.keys((await describe(tree, request)).routes), [])
  })

  it('should sort, because branches merge in the order their tenants answer', async () => {
    const tree = new Tree(
      trunk([node('/zed', [method('GET')]), node('/alpha', [method('GET')])]),
      endpoints,
      directives
    )

    assert.deepEqual(Object.keys((await describe(tree, request)).routes), ['/alpha', '/zed'])
  })
})
