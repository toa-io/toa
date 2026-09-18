import { ensure } from 'svas'
import { account } from '@/iam/svc/store'
import { configurations } from './store'
import * as origin from './net'

/**
 * Brings the component's configuration back to its deployed defaults, which are the
 * service's to know: the entry is read again rather than written from here.
 */
export async function reset(component: string): Promise<void | Error> {
  // the identity is what the service records as the originator, and resetting is a side
  // effect of a user action — so it must be there by now
  ensure(account)

  const done = await origin.reset(component)

  if (done instanceof Error) return done

  const configuration = await origin.get(component)

  if (configuration instanceof Error) return configuration

  configurations.set(configuration)
}
