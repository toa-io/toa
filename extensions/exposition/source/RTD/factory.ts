import { type Remotes } from '../Remotes'
import { Node, type Properties } from './Node'
import { Route } from './Route'
import { InputMethod, QueryMethod, type Method, type Methods } from './Method'
import { Endpoint } from './Endpoint'
import { type Context } from './Context'
import * as syntax from './syntax'
import { segment } from './segment'

export function createTrunk (definition: syntax.Node, remotes: Remotes): Node {
  const context: Context = { remotes, protected: true }

  return createNode(definition, context)
}

export function createBranch (definition: syntax.Branch, remotes: Remotes): Node {
  let nodeDefinition = createNodeDefinition(definition.component, definition.node)

  if (definition.namespace !== 'default')
    nodeDefinition = createNodeDefinition(definition.namespace, nodeDefinition)

  const context = { remotes }

  return createNode(nodeDefinition, context)
}

function createNode (definition: syntax.Node, context: Context): Node {
  const routes: Route[] = []
  const methods: Methods = new Map()
  const intermediate = '/' in definition

  for (const [key, value] of Object.entries(definition))
    if (key[0] === '/') {
      const route = createRoute(key, value, context)

      routes.push(route)
    } else if (syntax.methods.has(key as syntax.Method)) {
      const method = createMethod(key as syntax.Method, value, context)

      methods.set(key as syntax.Method, method)
    }

  const properties: Properties = {
    intermediate,
    protected: context.protected === true
  }

  return new Node(routes, methods, properties)
}

function createRoute (key: string, definition: syntax.Node, context: Context): Route {
  const segments = segment(key)
  const node = createNode(definition, context)

  return new Route(segments, node)
}

function createMethod (method: syntax.Method, mapping: syntax.Mapping, context: Context): Method {
  const discovery = context.remotes.discover(mapping.namespace, mapping.component)
  const endpoint = new Endpoint(discovery, mapping.endpoint)
  const Class = method === 'POST' ? InputMethod : QueryMethod

  return new Class(endpoint)
}

function createNodeDefinition (segment: string, node: syntax.Node): syntax.Node {
  const key = '/' + segment

  return { [key]: node }
}
