import { Node, IntermediateNode } from './Node'
import { Route } from './Route'
import { InputMethod, QueryMethod, type Method, type Methods } from './Method'
import { Endpoint } from './Endpoint'
import { type Context } from './Context'
import * as syntax from './syntax'
import { segment } from './segment'

export function createRoot (): Node {
  return new Node([], new Map())
}

export function createBranch (node: syntax.Node, context: Context): Node {
  let definition = createNodeDefinition(context.name, node)

  if (context.namespace !== 'default') definition = createNodeDefinition(context.namespace, definition)

  return createNode(definition, context)
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

  if (intermediate) return new IntermediateNode(routes)
  else return new Node(routes, methods)
}

function createRoute (key: string, value: syntax.Node, context: Context): Route {
  const segments = segment(key)
  const node = createNode(value, context)

  return new Route(segments, node)
}

function createMethod (method: syntax.Method, definition: syntax.Mapping, context: Context): Method {
  const endpoint = new Endpoint(context.remote, definition.endpoint)
  const Class = method === 'POST' ? InputMethod : QueryMethod

  return new Class(endpoint)
}

function createNodeDefinition (segment: string, node: syntax.Node): syntax.Node {
  const key = '/' + segment

  return { [key]: node }
}
