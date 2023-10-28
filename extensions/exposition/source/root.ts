import { decode, merge } from '@toa.io/generic'
import { syntax } from './RTD'

export function resolve (): syntax.Node {
  const value = process.env.TOA_EXPOSITION
  const root = value !== undefined ? decode<syntax.Node>(value) : syntax.createNode()

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
                family: 'auth',
                name: 'echo',
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
