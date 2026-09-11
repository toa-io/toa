import * as http from '../HTTP/index.ts'
import { fork } from '../RPC/Context.ts'
import { address, name, split } from '../RPC/names.ts'
import { METHOD_NOT_FOUND, failure, refusal, response } from './errors.ts'
import { annotations, input, output } from './schema.ts'
import { FAMILY, MCP, type Tool as Declaration } from '../directives/mcp/index.ts'
import { describing } from '../Introspection.ts'
import { variables } from '../RTD/segment.ts'
import type { Tree } from '../RTD/index.ts'
import type { Params, Result, Tool } from './types.ts'

/**
 * Every method this caller may reach that is published as a tool, named as the procedure
 * it is.
 *
 * A method is a tool where it says so with `mcp:tool`, and a default denies: a tree holds
 * what an application serves, and most of it is machinery a model has no business reading.
 * What a caller may then do with one is what `auth` says. The tree is walked once and each
 * method describes itself, which is where that is decided and where `io` and `map` say what
 * may be sent.
 *
 * Sorted, because the revision asks for an order a client can cache on.
 */
export async function list(tree: Tree, request: http.Context): Promise<Tool[]> {
  const tools: Tool[] = []

  /*
   * A description, not the request asking. What refuses a credentialed request at an
   * `anonymous` route does not refuse the call a tool makes, and a list that says otherwise
   * disagrees with what `tools/call` then does.
   */
  const context = describing(request)

  for (const { segments, verb, method } of tree.walk()) {
    if (!MCP.published(method.directives.declared<Declaration>(FAMILY))) continue

    const named = name(segments, verb)

    // a route a name cannot spell is a route nothing addresses, here or at `/.rpc`
    if (named === null) continue

    const params = variables(segments)
    const introspection = await method.explain(context, params)

    if (introspection === null) continue

    const described = introspection.description
    const schema = output(introspection)
    const hints = annotations(verb)

    // in the order the revision documents one, which is the order it is read in
    const tool: Tool = {
      name: named,
      ...(introspection.title === undefined ? {} : { title: introspection.title }),
      ...(described === undefined ? {} : { description: described }),
      inputSchema: input(
        introspection,
        params.map((param) => param.name),
        method.endpoint?.selection() ?? null
      ),
      ...(schema === undefined ? {} : { outputSchema: schema }),
      ...(hints === undefined ? {} : { annotations: hints })
    }

    tools.push(tool)
  }

  return tools.sort((one, other) => (one.name < other.name ? -1 : 1))
}

/**
 * The call the tool is. Its arguments are the procedure's parameters, taken apart the way a
 * request carries them, and what answers is the same `route` an ordinary request goes to.
 *
 * A name that is not a published tool is answered as no tool at all, whether or not a route
 * would have taken it: what an application did not publish is not reachable here by guessing
 * its name. What the caller may then do with one that is published is still `auth`'s to say.
 */
export async function call(scope: Scope, named: string, args: Params): Promise<Result> {
  if (!published(scope.tree, named))
    throw new http.NotFound(
      response(
        null,
        failure(METHOD_NOT_FOUND, `'${named}' is not a tool this server publishes`)
      )
    )

  const { path, verb, variables } = address(named, args)
  const { query, input: body } = split(args, variables)
  const clone = fork(scope.context, path, verb, query, body)

  try {
    const message = await scope.route(clone)

    // what `io:output` restricts, over this call's reply rather than the envelope
    await http.shape(clone, message)

    return result(message.body)
  } catch (exception) {
    /*
     * What the route made of this call is a value a model reads and may correct itself by:
     * an operation that refused, an argument `io:input` would not take, a record that is
     * not there, an identity `auth` would not let it act on. A credential is none of those
     * — that is the client's to fix and not the model's, so it is answered as it is — and
     * neither is a fault of this server, which is a protocol error and stays one.
     */
    if (
      exception instanceof http.ClientError &&
      !(exception instanceof http.Unauthorized)
    )
      return { content: [{ type: 'text', text: refusal(exception) }], isError: true }

    throw exception
  }
}

/** Everything a call needs that is not the call: the request it is of, and what answers it. */
export interface Scope {
  context: http.Context
  route: http.Processor
  tree: Tree
}

/**
 * Whether the tree publishes this name as a tool. What `auth` makes of the caller is not
 * asked here — the declaration is the route's and does not vary by who is calling, and the
 * call that follows is authorized as any request to that route is.
 */
function published(tree: Tree, named: string): boolean {
  for (const { segments, verb, method } of tree.walk())
    if (name(segments, verb) === named)
      return MCP.published(method.directives.declared<Declaration>(FAMILY))

  return false
}

function result(body: unknown): Result {
  if (body === undefined || body === null) return { content: [] }

  return {
    content: [{ type: 'text', text: JSON.stringify(body) }],
    structuredContent: body
  }
}
