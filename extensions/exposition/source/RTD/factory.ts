import { BRANCH_TTL } from '@toa.io/definitions/extensions.exposition'
import { Node, type Properties } from './Node.ts'
import { Route } from './Route.ts'
import { fragment, segment } from './segment.ts'
import { Method, type Methods } from './Method.ts'
import type { Context } from './Context.ts'
import type * as syntax from './syntax/index.ts'

export function createNode(node: syntax.Node, context: Context): Node {
  if (node.isolated === true) context.directives.stack = node.directives
  else context.directives.stack = node.directives.concat(context.directives.stack)

  described(node, context)

  const routes: Route[] = node.routes.map((route) => createRoute(route, context))
  const methods: Methods = {}

  for (const method of node.methods) methods[method.verb] = createMethod(method, context)

  const protect = node.protected ?? context.protected

  const properties: Properties = {
    protected: protect,
    forward: node.forward,
    expiration: protect ? Infinity : Date.now() + branchTTL()
  }

  return new Node(routes, methods, properties)
}

export function branchTTL(): number {
  const value = process.env.__TESTING_EXPOSITION_BRANCH_TTL

  if (value === undefined || value === '') return BRANCH_TTL

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : BRANCH_TTL
}

function createRoute(route: syntax.Route, context: Context): Route {
  const stack = context.directives.stack.slice()
  const path = context.path
  const segments = segment(route.path)

  context.path = join(path, route.path)

  /*
   * What a node says of itself is not said of what is under it. Its own `/` is the
   * exception: an intermediate node is never what a path matches, because that route
   * answers in its place — so the two are one resource and what describes it carries.
   */
  if (route.path !== ROOT)
    context.directives.stack = stack.filter((directive) =>
      context.directives.factory.inheritable(directive)
    )

  const node = createNode(route.node, context)

  context.directives.stack = stack // restore
  context.path = path

  return new Route(segments, node)
}

function join(base: string, path: string): string {
  // '/one/' and '/two/' would otherwise read as '/one//two/'
  return (base + path).replace(/\/+/g, '/').replace(/(.)\/$/, '$1')
}

function createMethod(method: syntax.Method, context: Context): Method {
  const stack = method.directives.concat(context.directives.stack)
  const directives = context.directives.factory.create(stack, context.path)

  const endpoint =
    method.mapping?.endpoint === undefined
      ? null
      : context.endpoints.create(method, context)

  return new Method(endpoint, directives)
}

/**
 * A resource is what it is described beside: a node with no methods of its own is never
 * what a path answers, so nothing would carry what it says about itself. Refused where the
 * declaration is, rather than left to be noticed by whoever cannot find it in the answer.
 */
function described(node: syntax.Node, context: Context): void {
  const help = node.directives.find(
    (directive) => directive.family === HELP && directive.name === 'node'
  )

  if (help === undefined || node.methods.length > 0) return

  // an intermediate node's `/` answers in its place, and carries what it says
  if (node.routes.some((route) => route.path === ROOT)) return

  const route = '/' + fragment(context.path).join('/')

  throw new Error(`Directive help:node: '${route}' serves no methods`)
}

const ROOT = '/'
const HELP = 'help'
