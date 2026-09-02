import { Emission, Event } from '@toa.io/core'

import * as boot from './index.js'
import * as extensions from './extensions/index.js'

const emission = async (definitions, locator, context) => {
  if (definitions === undefined) return

  const events = await Promise.all(Object.entries(definitions).map(async ([label, definition]) => {
    const emitter = await boot.bindings.emit(definition.binding, locator, label)
    const decorator = extensions.emitter(emitter, label, locator)
    const bridge = await boot.bridge.event(definition.bridge, definition.path, label, context)

    return new Event({ ...definition, label: `${locator.id}.${label}` }, decorator, bridge)
  }))

  return new Emission(events)
}

export { emission }
