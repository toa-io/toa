import * as schemas from '../schemas'
import {
  verbs,
  type Node,
  type Route,
  type Method,
  type Mapping,
  type Directive
} from './types'

export function parse (input: object, shortcuts?: Shortcuts): Node {
  const node = parseNode(input, shortcuts)

  schemas.node.validate(node)

  return node
}

function parseNode (input: object, shortcuts?: Shortcuts): Node {
  const node = createNode()

  for (let [key, value] of Object.entries(input)) {
    if (key[0] === '/') {
      const route = parseRoute(key, value, shortcuts)

      node.routes.push(route)

      continue
    }

    if (verbs.has(key)) {
      const method = parseMethod(key, value)

      node.methods.push(method)

      continue
    }

    if (shortcuts?.has(key) === true)
      key = shortcuts.get(key) as string

    const match = key.match(DIRECTIVE_RX)

    if (match !== null) {
      const { family, name } = match.groups as { family: string, name: string }
      const directive: Directive = { family, name, value }

      node.directives.push(directive)

      continue
    }

    throw new Error(`RTD parse error: unknown key '${key}'.`)
  }

  return node
}

export function createNode (): Node {
  return {
    routes: [],
    methods: [],
    directives: []
  }
}

function parseRoute (path: string, value: object, shortcuts?: Shortcuts): Route {
  const node = parse(value, shortcuts)

  return createRoute(path, node)
}

function createRoute (path: string, node: Node): Route {
  return { path, node }
}

function parseMethod (verb: string, value: Mapping | string): Method {
  const mapping = typeof value === 'string' ? { endpoint: value } : value

  parseEndpoint(mapping)

  return { verb, mapping }
}

function parseEndpoint (mapping: Mapping): void {
  const [endpoiont, component, namespace] = mapping.endpoint.split('.').reverse()

  if (component !== undefined) {
    mapping.component = component
    mapping.namespace = namespace ?? mapping.namespace ?? 'default'
    mapping.endpoint = endpoiont
  }
}

const DIRECTIVE_RX = /^(?<family>\w{1,16}):(?<name>\w{1,6})$/

type Shortcuts = Map<string, string>
