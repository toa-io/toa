import { Node, type Properties } from './Node'
import { Route } from './Route'
import { type Context } from './Context'
import { segment } from './segment'
import { Method, type Methods } from './Method'
import { type Endpoint } from './Endpoint'
import { type Directives } from './Directives'
import type * as syntax from './syntax'

export function createNode<TEndpoint extends Endpoint, TDirectives extends Directives>
(node: syntax.Node, context: Context): Node<TEndpoint, TDirectives> {
  if (node.isolated === true)
    context.directives.stack = node.directives
  else
    context.directives.stack = node.directives.concat(context.directives.stack)

  const routes: Route[] = node.routes.map((route) => createRoute(route, context))
  const methods: Methods = {}

  for (const method of node.methods)
    methods[method.verb] = createMethod(method, context)

  const properties: Properties = { protected: node.protected ?? context.protected }

  return new Node(routes, methods, properties)
}

function createRoute (route: syntax.Route, context: Context): Route {
  const stack = context.directives.stack.slice()
  const segments = segment(route.path)
  const node = createNode(route.node, context)

  context.directives.stack = stack // restore

  return new Route(segments, node)
}

function createMethod (method: syntax.Method, context: Context): Method {
  const stack = context.directives.stack.concat(method.directives.reverse())
  const directives = context.directives.factory.create(stack)

  const endpoint = method.mapping.endpoint === undefined
    ? null
    : context.endpoints.create(method, context)

  return new Method(endpoint, directives)
}
