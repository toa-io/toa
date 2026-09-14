import type * as RTD from './RTD/syntax/index.ts'
import type { Node } from './RTD/index.ts'

export interface Branch {
  namespace: string
  component: string
  isolated: boolean
  node: RTD.Node

  /**
   * The version of the component whose routes these are. It is what the contract of every
   * endpoint they reach belongs to, so a component that changed without its routes changing
   * is still a different thing to expose.
   */
  version: string

  /** What the routes are, so that a tree changed by something other than the sources is one too. */
  routes: string

  /**
   * When the tenant that announced it started, by its own clock. A replica on its way
   * out announces the same component with an older stamp than the one replacing it, and
   * that is what tells the two apart when their versions differ.
   */
  timestamp: number
}

/** A branch the gateway has merged, and the tenant it came from. */
export interface Exposed {
  version: string

  /** @see Branch.routes */
  routes: string

  /** The start time of the tenant this branch came from. */
  timestamp: number

  nodes: Node[]
}

/**
 * What to do with an announcement about a component that already has a branch exposed.
 *
 * - `refresh`: the same component and the same routes, so its expiration is extended and its
 *   endpoints left alone
 * - `superseded`: it came from a tenant that started before the one exposed now
 * - `merge`: everything else
 */
export function decide(exposed: Exposed, branch: Branch): Decision {
  if (exposed.version === branch.version && exposed.routes === branch.routes) return 'refresh'

  if (branch.timestamp < exposed.timestamp) return 'superseded'

  return 'merge'
}

export type Decision = 'merge' | 'refresh' | 'superseded'
