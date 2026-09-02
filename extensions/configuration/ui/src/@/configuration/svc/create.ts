import { ensure } from 'svas'
import { account } from '@/iam/svc/store'
import { configurations } from './store'
import * as origin from './net'
import type { Node } from './net'

/**
 * Creates a configuration for the component. A configuration is immutable, so this is a
 * new object rather than a change to the one there — and what it answers with is the
 * epoch it was filed under.
 *
 * The created value is written into the store, so every screen showing it follows
 * without asking the service again.
 */
export async function create(component: string, configuration: Node): Promise<void | Error> {
  // the identity is what the service records as the originator, and creating is a side
  // effect of a user action — so it must be there by now
  ensure(account)

  const created = await origin.create(component, configuration)

  if (created instanceof Error) return created

  configurations.update(component, (current) => ({
    ...current,
    configuration,
    epoch: created.epoch,
  }))
}
