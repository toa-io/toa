import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'

import { Tree } from './Tree.js'
import { address, name } from '../RPC/names.js'
import type { EndpointsFactory } from '../Endpoint.js'
import type { DirectiveFactory } from './Directives.js'
import type * as syntax from './syntax/index.js'

const endpoints = {} as unknown as EndpointsFactory

const directives = {
  create: () => ({
    precall: async () => null,
    settle: async () => undefined,
    dispose: () => undefined
  }),
  dispose: mock.fn()
} as unknown as DirectiveFactory

const node = (path: string, verbs: string[] = [], routes: syntax.Route[] = []): syntax.Route => ({
  path,
  node: {
    routes,
    methods: verbs.map((verb) => ({ verb, directives: [] })),
    directives: []
  }
})

const trunk = (routes: syntax.Route[], verbs: string[] = []): syntax.Node => ({
  routes,
  methods: verbs.map((verb) => ({ verb, directives: [] })),
  directives: []
})

/** What a walk names, which is what a caller of `/.rpc` would write. */
function names (tree: Tree): string[] {
  return [...tree.walk()].map(({ segments, verb }) => name(segments, verb))
    .filter((named): named is string => named !== null)
}

describe('walk', () => {
  it('should name the trunk by its verb alone', () => {
    const tree = new Tree(trunk([], ['GET']), endpoints, directives)

    assert.deepEqual(names(tree), ['GET'])
  })

  it('should name every method of every route', () => {
    const tree = new Tree(trunk([
      node('/pots', ['GET', 'POST'], [node('/:id', ['GET', 'DELETE'])])
    ]), endpoints, directives)

    assert.deepEqual(names(tree).sort(), [
      'pots/GET', 'pots/POST', 'pots/_id/DELETE', 'pots/_id/GET'
    ])
  })

  it('should walk a branch that was merged', () => {
    const tree = new Tree(trunk([]), endpoints, directives)

    tree.merge(trunk([node('/pots', ['GET'])]), { namespace: 'default', component: 'pots' })

    assert.deepEqual(names(tree), ['pots/GET'])
  })

  it('should name a tail', () => {
    const tree = new Tree(trunk([node('/files', [], [node('/**', ['GET'])])]),
      endpoints, directives)

    assert.deepEqual(names(tree), ['files/__/GET'])
  })

  it('should skip an intermediate node, whose route answers in its place', () => {
    const tree = new Tree(trunk([
      // `/posts` is intermediate: `/posts/` is answered by its `/` route, not by itself
      node('/posts', ['PATCH'], [node('/', ['PUT'])])
    ]), endpoints, directives)

    assert.deepEqual(names(tree), ['posts/PUT'])
  })

  it('should name nothing where a segment cannot be spelled', () => {
    const tree = new Tree(trunk([node('/v1.0', ['GET']), node('/pots', ['GET'])]),
      endpoints, directives)

    assert.deepEqual(names(tree), ['pots/GET'])
  })

  it('should name what the tree then matches', () => {
    const tree = new Tree(trunk([
      node('/pots', ['GET'], [node('/:id', ['GET']), node('/hot', ['GET'])]),
      node('/files', [], [node('/**', ['GET'])])
    ], ['GET']), endpoints, directives)

    const params = { id: 'a1b2', '**': 'a/b/c' }

    for (const { segments, verb } of tree.walk()) {
      const named = name(segments, verb)

      assert.notStrictEqual(named, null, 'every walked method has a name')

      const { path } = address(named!, params)
      const match = tree.match(path)

      assert.notStrictEqual(match, null, `'${named!}' resolves to '${path}', which matches`)
      assert.ok(verb in match!.node.methods, `'${named!}' matches a node that answers ${verb}`)
    }
  })
})
