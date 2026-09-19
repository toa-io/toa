import { Event, Rendering } from '@toa.io/core'

import * as boot from './index.js'

/**
 * Gives every destination that names the events it renders a `Rendering` of them, made with the
 * component's own bridges. Every event of the manifest may be named, including those nothing
 * consumes and are therefore not published: a destination writes somewhere of its own.
 *
 * @param {toa.norm.Component} manifest
 * @param {import('@toa.io/core/types').outbox.Destination[]} destinations
 * @param {import('@toa.io/core').Context} context
 * @returns {Promise<void>}
 */
export const rendering = async (manifest, destinations, context) => {
  for (const destination of destinations) {
    if (destination.renders === undefined) continue

    const events = new Map()

    for (const label of destination.renders) {
      const definition = manifest.events?.[label]

      if (definition === undefined)
        throw new Error(
          `Component '${manifest.locator.id}' has no event '${label}' to render for ` +
            `'${destination.name}'`
        )

      const bridge = await boot.bridge.event(
        definition.bridge,
        definition.path,
        label,
        context
      )
      const event = new Event(
        { ...definition, label: `${manifest.locator.id}.${label}` },
        null,
        bridge
      )

      events.set(label, event)
    }

    const rendering = new Rendering(events)

    destination.rendering = rendering
    destination.depends(rendering)
  }
}
