import { it, mock } from 'node:test'
import assert from 'node:assert/strict'

import { Tree } from './Tree.js'
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

const root: syntax.Node = {
  routes: [],
  methods: [],
  directives: []
}

const pots: syntax.Node = {
  routes: [
    {
      path: '/pots',
      node: {
        routes: [],
        methods: [{ verb: 'GET', directives: [] }],
        directives: []
      }
    }
  ],
  methods: [],
  directives: []
}

it('should extend expiration without rebuilding the branch', () => {
  process.env.__TESTING_EXPOSITION_BRANCH_TTL = '1000'

  const now = mock.method(Date, 'now', () => 10_000)
  const tree = new Tree(root, endpoints, directives)
  const nodes = tree.merge(pots, { namespace: 'default', component: 'pots' })
  const match = tree.match('/pots/')

  assert.notStrictEqual(match, null)

  now.mock.mockImplementation(() => 10_900)
  tree.refresh(nodes)

  now.mock.mockImplementation(() => 11_500)

  const refreshed = tree.match('/pots/')

  assert.notStrictEqual(refreshed, null)
  assert.strictEqual(refreshed?.node, match?.node)

  now.mock.restore()
  delete process.env.__TESTING_EXPOSITION_BRANCH_TTL
})

it('should ignore expired nodes during match', () => {
  process.env.__TESTING_EXPOSITION_BRANCH_TTL = '1000'

  const now = mock.method(Date, 'now', () => 10_000)
  const tree = new Tree(root, endpoints, directives)

  tree.merge(pots, { namespace: 'default', component: 'pots' })

  assert.notStrictEqual(tree.match('/pots/'), null)

  now.mock.mockImplementation(() => 11_000)

  assert.strictEqual(tree.match('/pots/'), null)

  now.mock.restore()
  delete process.env.__TESTING_EXPOSITION_BRANCH_TTL
})
