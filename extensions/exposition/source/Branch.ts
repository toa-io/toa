import type { Contract } from '@toa.io/core'
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

  /**
   * What the component whose routes these are provides. It travels with them because what the
   * gateway forwards is described by the version that offered the route, and the map this
   * process reads may name the version before it.
   */
  contract: Contract

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
 * - `superseded`: it came from a tenant that started before the one exposed now, while the
 *   exposed branch is still served
 * - `merge`: everything else
 */
export function decide(exposed: Exposed, branch: Branch): Decision {
  if (exposed.version === branch.version && exposed.routes === branch.routes) return 'refresh'

  if (branch.timestamp < exposed.timestamp && !expired(exposed)) return 'superseded'

  return 'merge'
}

/**
 * A tenant that has gone without saying so stops refreshing its branch, and once the branch
 * expires, nothing it held off is served. What started before it is all there is left to expose.
 */
function expired(exposed: Exposed): boolean {
  const now = Date.now()

  return exposed.nodes.length > 0 && exposed.nodes.every((node) => now >= node.expiration)
}

export type Decision = 'merge' | 'refresh' | 'superseded'
