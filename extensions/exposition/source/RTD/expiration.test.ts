import { Tree } from './Tree'
import type { EndpointsFactory } from '../Endpoint'
import type { DirectiveFactory } from './Directives'
import type * as syntax from './syntax'

const endpoints = {} as unknown as EndpointsFactory

const directives = {
  create: () => ({
    preflight: async () => null,
    settle: async () => undefined,
    dispose: () => undefined
  }),
  dispose: jest.fn()
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

  const now = jest.spyOn(Date, 'now').mockReturnValue(10_000)
  const tree = new Tree(root, endpoints, directives)
  const nodes = tree.merge(pots, { namespace: 'default', component: 'pots' })
  const match = tree.match('/pots/')

  expect(match).not.toBeNull()

  now.mockReturnValue(10_900)
  tree.refresh(nodes)

  now.mockReturnValue(11_500)

  const refreshed = tree.match('/pots/')

  expect(refreshed).not.toBeNull()
  expect(refreshed?.node).toBe(match?.node)

  now.mockRestore()
  delete process.env.__TESTING_EXPOSITION_BRANCH_TTL
})

it('should ignore expired nodes during match', () => {
  process.env.__TESTING_EXPOSITION_BRANCH_TTL = '1000'

  const now = jest.spyOn(Date, 'now').mockReturnValue(10_000)
  const tree = new Tree(root, endpoints, directives)

  tree.merge(pots, { namespace: 'default', component: 'pots' })

  expect(tree.match('/pots/')).not.toBeNull()

  now.mockReturnValue(11_000)

  expect(tree.match('/pots/')).toBeNull()

  now.mockRestore()
  delete process.env.__TESTING_EXPOSITION_BRANCH_TTL
})
