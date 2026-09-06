import { describing } from '../Introspection.js'
import { template } from '../RPC/names.js'
import { variables } from '../RTD/segment.js'
import { guarded, resource, type Described } from '../directives/help/index.js'
import type * as http from '../HTTP/index.js'
import type { Tree } from '../RTD/index.js'
import type { Introspection } from '../Introspection.js'

/**
 * Every route in the tree this caller may reach, keyed by the template it answers at, and
 * each described exactly as `OPTIONS` on that path describes it — so a key can be taken
 * from the answer and sent back as a request.
 *
 * A route a name cannot spell is here, unlike at `/.rpc` and `/.mcp`: HTTP addresses a
 * route by its path, so leaving one out would make this disagree with the router. A
 * resource no method of which this caller may reach is not here at all — `OPTIONS` answers
 * `403` to one, and an empty entry would still say it exists.
 *
 * Sorted, because a branch is merged whenever its tenant answers and two replicas would
 * otherwise order the same tree differently. Verbs keep the order they were declared in,
 * which is the order `OPTIONS` answers them in.
 */
export async function describe(tree: Tree, request: http.Context): Promise<Discovered> {
  const context = describing(request)
  const routes = new Map<string, Mounted>()

  /*
   * Sequentially: there is no I/O to overlap — an endpoint's own description is read once
   * and memoized — so awaiting the whole tree at once would only allocate every clone of
   * it at the same moment.
   */
  for (const { segments, verb, method } of tree.walk()) {
    const introspection = await method.explain(context, variables(segments))

    if (introspection === null) continue

    const route = template(segments)
    let mounted = routes.get(route)

    if (mounted === undefined) {
      mounted = { described: resource(method.directives), methods: {} }
      routes.set(route, mounted)
    }

    // two declarations can walk to one template — `/a/b` and `/a: { /b: }` — and the walk
    // is in the order `match` tries them, so the first is the one a request would reach
    mounted.methods[verb] ??= introspection
  }

  const described: Record<string, Resource> = {}

  for (const route of Array.from(routes.keys()).sort()) {
    const { described: stated, methods } = routes.get(route)!

    // what the resource is, beside the methods it serves; a verb is upper case and cannot
    // collide with either key
    described[route] = { ...stated, ...guarded(methods), ...methods }
  }

  return { routes: described }
}

/** What the tree answers. An object, so that what is said of the whole of it has somewhere to go. */
export interface Discovered {
  routes: Record<string, Resource>
}

/** What one resource is, and what it serves; a verb is upper case, and nothing else here is. */
export interface Resource extends Described {
  [verb: string]: unknown
}

/** One route template as the walk found it, before the two are answered as one. */
interface Mounted {
  described: Described | null
  methods: Record<string, Introspection>
}
