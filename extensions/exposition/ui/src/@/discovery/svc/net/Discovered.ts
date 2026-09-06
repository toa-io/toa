/** What a resource or a method says of itself, as the gateway answers it. */
export interface Described {
  title?: string
  description?: string

  /** reaching it is being the identity it is about — `auth:id` */
  private?: boolean

  /** reaching it takes a role — `auth:role` */
  protected?: boolean

  /** and that role is one of the `system` scope */
  system?: boolean
}

/** What one method takes and answers. A schema is read as a shape; see `ui/shape`. */
export interface Method extends Described {
  /** whether the route publishes it to a model — `mcp:tool` */
  mcp?: boolean

  route?: Record<string, Schema>
  query?: Record<string, Schema>
  input?: Schema
  output?: Schema
  errors?: string[]
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
