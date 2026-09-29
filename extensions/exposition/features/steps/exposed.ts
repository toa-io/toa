import { subscribe, unsubscribe } from 'node:diagnostics_channel'
import { ANNOUNCED, DECIDED } from '../../source/diagnostics.ts'
import type { Announcement } from '../../source/diagnostics.ts'

/**
 * Connects, and returns once the gateway has acted on every branch the connection announced.
 *
 * The gateway outlives a scenario, and a component booted under a manifest of its own is
 * announced over the broker: until the gateway has merged it, a request is answered by the
 * branch the scenario before it left, or by none.
 */
export async function exposed(connect: () => Promise<void>): Promise<void> {
  const pending = new Set<string>()
  const done = new Set<string>()
  let wake: (() => void) | null = null

  const onAnnounced = (message: unknown): void => {
    pending.add(key(message as Announcement))
  }

  const onDecided = (message: unknown): void => {
    done.add(key(message as Announcement))
    wake?.()
  }

  subscribe(ANNOUNCED, onAnnounced)
  subscribe(DECIDED, onDecided)

  try {
    await connect()

    while (Array.from(pending).some((announcement) => !done.has(announcement)))
      await new Promise<void>((resolve) => (wake = resolve))
  } finally {
    unsubscribe(ANNOUNCED, onAnnounced)
    unsubscribe(DECIDED, onDecided)
  }
}

function key({ id, timestamp }: Announcement): string {
  return `${id}@${timestamp}`
}
