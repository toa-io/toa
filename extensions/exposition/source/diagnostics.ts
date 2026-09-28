import { channel } from 'node:diagnostics_channel'

/**
 * What a process that hosts both a tenant and the gateway, which is what a scenario is, can
 * wait on: a branch it announced, and the gateway having acted on it. Neither is published
 * while nobody subscribes.
 */
export const announced = channel('toa:exposition:announced')
export const decided = channel('toa:exposition:decided')

/** A branch as both channels name it: which component, and which start of its tenant. */
export interface Announcement {
  id: string
  timestamp: number
}
