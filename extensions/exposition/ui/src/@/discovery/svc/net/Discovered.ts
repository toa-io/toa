/** What a resource or a method says of itself, as the gateway answers it. */
export interface Described {
  title?: string
  description?: string

  /** reaching it takes nothing at all, and presenting a credential is refused — `auth:anonymous` */
  anonymous?: boolean

  /** reaching it takes being someone, whoever — `auth:anyone` and its like */
  authenticated?: boolean

  /** reaching it is being the identity it is about — `auth:id` */
  private?: boolean

  /** reaching it takes a role — `auth:role` */
  protected?: boolean

  /** and that role is one of the `system` scope */
  system?: boolean
}

/** What one method takes and answers. A schema is read as a shape; see `ui/shape`. */
export interface Method extends Described {
  /** whether making the call twice changes state once — the operation declares `once` */
  once?: boolean

  /** whether the route publishes it to a model — `mcp:tool` */
  mcp?: boolean

  route?: Record<string, Schema>
  query?: Record<string, Schema>

  /** what picks the records — `criteria`, `sort`, `limit`, `omit`, `search` */
  selection?: Record<string, Schema>

  /** what sending a file here takes, where the body is one — `octets:put` */
  octets?: Octets
  input?: Schema
  output?: Schema
  errors?: string[]
}

/** What sending a file to a resource takes, which is not something a schema states. */
export interface Octets {
  /** what may be sent, in the syntax of an `accept` header; anything where unstated */
  accept?: string
  limit: string
  /** whether the reply arrives as a stream of parts rather than as one object */
  stream?: boolean
}

export type Schema = Record<string, unknown>

/**
 * One resource: what it is, beside every method of it this caller may reach. A verb is
 * upper case and nothing else here is, which is what tells the two apart.
 */
export type Resource = Described & Record<string, unknown>

/** What `OPTIONS /.discovery` answers. */
export interface Discovered {
  routes: Record<string, Resource>
}
