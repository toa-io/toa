import * as schemas from '../../schemas'
import {
  verbs,
  type Node,
  type Route,
  type Method,
  type Mapping,
  type Directive,
  type Range
} from './types'

export function parse (input: object, shortcuts?: Shortcuts): Node {
  const node = parseNode(input, shortcuts)

  schemas.node.validate(node)

  return node
}

function parseNode (input: object | string, shortcuts?: Shortcuts): Node {
  const node = createNode()

  if (typeof input === 'string') {
    node.forward = input

    return node
  }

  for (const [key, value] of Object.entries(input) as Array<[keyof Node, unknown]>)
    switch (key) {
      case 'protected':
      case 'isolated':
        node[key] = value as boolean
        break
      case 'forward':
        node[key] = value as string
        break

      default:
        // eslint-disable-next-line max-depth
        if (key[0] === '/') {
          const route = parseRoute(key, value as Node, shortcuts)

          node.routes.push(route)

          continue
        }

        // eslint-disable-next-line max-depth
        if (verbs.has(key)) {
          const method = parseMethod(key, value as Mapping, shortcuts)

          node.methods.push(method)

          continue
        }

        // eslint-disable-next-line no-case-declarations
        const directive = parseDirective(key, value, shortcuts)

        // eslint-disable-next-line max-depth
        if (directive !== null) {
          node.directives.push(directive)

          continue
        }

        throw new Error(`RTD parse error: unknown key '${key}'`)
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

function parseRoute (path: string, value: Node, shortcuts?: Shortcuts): Route {
  const node = parse(value, shortcuts)

  return createRoute(path, node)
}

function createRoute (path: string, node: Node): Route {
  return { path, node }
}

function parseMethod (verb: string, value: Mapping | string, shortcuts?: Shortcuts): Method {
  const mapping = typeof value === 'string' ? { endpoint: value } : value

  parseEndpoint(mapping)
  parseQuery(mapping)

  const directives = parseDirectives(mapping, shortcuts)

  return { verb, mapping, directives }
}

function parseEndpoint (mapping: Mapping): void {
  if (mapping.endpoint === undefined)
    return

  const [endpoiont, component, namespace] = mapping.endpoint.split('.').reverse()

  if (component !== undefined) {
    mapping.component = component
    mapping.namespace = namespace ?? mapping.namespace ?? 'default'
    mapping.endpoint = endpoiont
  }
}

function parseQuery (mapping: any): void {
  const query = mapping.query

  if (query === undefined || query === null)
    return

  if (typeof query.limit === 'number')
    query.limit = expandRange(query.limit as number)

  if (typeof query.omit === 'number')
    query.omit = expandRange(query.omit as number)
}

function parseDirectives (mapping: Record<string, any>, shortcuts?: Shortcuts): Directive[] {
  const directives: Directive[] = []

  for (const [key, value] of Object.entries(mapping)) {
    const directive = parseDirective(key, value, shortcuts)

    if (directive === null)
      continue

    directives.push(directive)

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete mapping[key]
  }

  return directives
}

function parseDirective (key: string, value: any, shortcuts?: Shortcuts): Directive | null {
  if (shortcuts?.has(key) === true)
    key = shortcuts.get(key)! // eslint-disable-line @typescript-eslint/no-non-null-assertion

  const match = key.match(DIRECTIVE_RX)

  if (match === null)
    return null

  const { family, name } = match.groups as { family: string, name: string }

  return { family, name, value }
}

function expandRange (range: number): Range {
  return { value: range, range: [range, range] }
}

const DIRECTIVE_RX = /^(?<family>\w{1,32}):(?<name>\w{1,32})$/

export type Shortcuts = Map<string, string>
