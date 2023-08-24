import { Node, type Properties } from './Node'
import { Route } from './Route'
import { type Context } from './Context'
import { segment } from './segment'
import { type Methods } from './Method'
import type * as syntax from './syntax'

export function createNode<TMethod> (node: syntax.Node, context: Context): Node<TMethod> {
  const routes: Route[] = node.routes.map((route) => createRoute(route, context))
  const methods: Methods<TMethod> = {}

  for (const method of node.methods)
    methods[method.verb] = context.methods.create(method, context)

  const properties: Properties = { protected: context.protected }

  return new Node(routes, methods, properties)
}

function createRoute (route: syntax.Route, context: Context): Route {
  const segments = segment(route.path)
  const node = createNode(route.node, context)

  return new Route(segments, node)
}
