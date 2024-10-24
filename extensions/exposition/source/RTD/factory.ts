import { Node, type Properties } from './Node'
import { Route } from './Route'
import { segment } from './segment'
import { Method, type Methods } from './Method'
import type { Context } from './Context'
import type * as syntax from './syntax'

export function createNode (node: syntax.Node, context: Context): Node {
  if (node.isolated === true)
    context.directives.stack = node.directives
  else
    context.directives.stack = node.directives.concat(context.directives.stack)

  const routes: Route[] = node.routes.map((route) => createRoute(route, context))
  const methods: Methods = {}

  for (const method of node.methods)
    methods[method.verb] = createMethod(method, context)

  const properties: Properties = {
    protected: node.protected ?? context.protected,
    forward: node.forward
  }

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
  const stack = method.directives.concat(context.directives.stack)
  const directives = context.directives.factory.create(stack)

  const endpoint = method.mapping?.endpoint === undefined
    ? null
    : context.endpoints.create(method, context)

  return new Method(endpoint, directives)
}
