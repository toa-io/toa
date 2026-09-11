import { environment, merge } from '@toa.io/generic'
import { syntax } from './RTD/index.ts'

export function resolve(): syntax.Node {
  const value = environment.get('TOA_EXPOSITION')
  const root =
    value !== undefined ? (JSON.parse(value) as syntax.Node) : syntax.createNode()

  merge(root, PREDEFINED)

  return root
}

const PREDEFINED: syntax.Node = {
  routes: [
    {
      path: '/identity',
      node: {
        isolated: true,
        routes: [],
        methods: [
          {
            verb: 'GET',
            directives: [
              {
                family: 'io',
                name: 'output',
                value: ['id', 'roles']
              },
              {
                family: 'auth',
                name: 'echo',
                value: null
              }
            ]
          },
          {
            verb: 'POST',
            directives: [
              {
                family: 'io',
                name: 'output',
                value: ['id', 'roles']
              },
              {
                family: 'auth',
                name: 'incept',
                value: null
              }
            ]
          }
        ],
        directives: []
      }
    }
  ],
  methods: [],
  directives: []
}
