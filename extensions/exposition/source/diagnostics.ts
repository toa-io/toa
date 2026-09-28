import { channel } from 'node:diagnostics_channel'
import { environment } from '@toa.io/generic'

/**
 * What a process that hosts both a tenant and the gateway, which is what a scenario is, can
 * wait on: a branch it announced, and the gateway having acted on it. Published only under
 * `TOA_DEV`: a deployment has nothing that waits on either.
 */
export const ANNOUNCED = 'toa:exposition:announced'
export const DECIDED = 'toa:exposition:decided'

/** A branch as both channels name it: which component, and which start of its tenant. */
export interface Announcement {
  id: string
  timestamp: number
}

export function publish(
  name: typeof ANNOUNCED | typeof DECIDED,
  announcement: Announcement
): void {
  if (environment.get('TOA_DEV') !== '1') return

  const target = channel(name)

  if (target.hasSubscribers) target.publish(announcement)
}
