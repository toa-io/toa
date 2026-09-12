import { it, mock } from 'node:test'
import assert from 'node:assert/strict'

import { Tree } from './Tree.ts'
import type { EndpointsFactory } from '../Endpoint.ts'
import type { DirectiveFactory } from './Directives.ts'
import type * as syntax from './syntax/index.ts'

const endpoints = {} as unknown as EndpointsFactory

const directives = {
  create: () => ({
    precall: async () => null,
    settle: async () => undefined,
    dispose: () => undefined
  }),
  dispose: mock.fn()
} as unknown as DirectiveFactory

const root: syntax.Node = { routes: [], methods: [], directives: [] }

const pots: syntax.Node = {
  routes: [
    {
      path: '/pots',
      node: { routes: [], methods: [{ verb: 'GET', directives: [] }], directives: [] }
    }
  ],
  methods: [],
  directives: []
}

it('should build what is derived from the tree once', () => {
  const tree = new Tree(root, endpoints, directives)
  const build = mock.fn(() => ({}))

  const one = tree.derived('key', build)
  const other = tree.derived('key', build)

  assert.strictEqual(one, other)
  assert.strictEqual(build.mock.calls.length, 1)
})

it('should drop what is derived from the tree when a branch is merged', () => {
  const tree = new Tree(root, endpoints, directives)
  const build = mock.fn(() => ({}))

  const one = tree.derived('key', build)

  tree.merge(pots, { namespace: 'default', component: 'pots' })

  const other = tree.derived('key', build)

  assert.notStrictEqual(one, other)
  assert.strictEqual(build.mock.calls.length, 2)
})
