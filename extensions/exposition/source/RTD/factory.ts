import { Node } from './Node'
import { Route } from './Route'
import { InputMethod, QueryMethod, type Method, type Methods } from './Method'
import * as syntax from './syntax'
import { segment } from './segment'
import { type Context } from './Context'
import { Endpoint } from './Endpoint'

export function createNode (definition: syntax.Node, context: Context): Node {
  const routes: Route[] = []
  const methods: Methods = new Map()
  const intermediate = '/' in definition

  for (const [key, value] of Object.entries(definition))
    if (key[0] === '/')
      routes.push(createRoute(key, value, context))
    else if (syntax.methods.has(key as syntax.Method)) {
      const method = createMethod(key as syntax.Method, value, context)

      methods.set(key as syntax.Method, method)
    }

  return new Node(routes, methods, intermediate)
}

export function createRoute (key: string, value: syntax.Node, context: Context): Route {
  const segments = segment(key)
  const node = createNode(value, context)

  return new Route(segments, node)
}

export function createMethod (method: syntax.Method, definition: syntax.Mapping, context: Context): Method {
  const endpoint = new Endpoint(context.remote, definition.endpoint)
  const Class = method === 'POST' ? InputMethod : QueryMethod

  return new Class(endpoint)
}
