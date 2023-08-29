import { Node, type Properties } from './Node'
import { Route } from './Route'
import { type Context } from './Context'
import { segment } from './segment'
import { type Method, type Methods } from './Method'
import type * as syntax from './syntax'

export function createNode<TMethod extends Method>
(node: syntax.Node, context: Context): Node<TMethod> {
  context.directives.stack.push(...node.directives)

  const routes: Route[] = node.routes.map((route) => createRoute(route, context))
  const methods: Methods<TMethod> = {}

  for (const method of node.methods)
    methods[method.verb] = context.methods.create(method, context)

  const directives = context.directives.factory.create(context.directives.stack)
  const properties: Properties = { protected: node.protected ?? context.protected }

  return new Node(routes, methods, directives, properties)
}

function createRoute (route: syntax.Route, context: Context): Route {
  const stack = context.directives.stack.slice()
  const segments = segment(route.path)
  const node = createNode(route.node, context)

  context.directives.stack = stack // restore

  return new Route(segments, node)
}
