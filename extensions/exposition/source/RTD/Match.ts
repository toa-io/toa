import { type Node } from './Node.ts'

export interface Match {
  node: Node
  parameters: Parameter[]

  /**
   * The path that was matched, with placeholders as declared — `/users/:id/` and not
   * `/users/42/`. A metric labels a request by it, because a URL is unbounded and a series per
   * URL is a series per caller.
   */
  route: string
}

export interface Parameter {
  name: string
  value: string
}
