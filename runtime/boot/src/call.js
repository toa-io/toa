import { Call, safe, Transmission } from '@toa.io/core'

import * as boot from './index.js'

// eslint-disable-next-line max-params
export const call = async (locator, endpoint, definition, entity, source) => {
  const consumers = await boot.bindings.consume(locator, endpoint, definition.bindings)
  const transmission = new Transmission(consumers)
  const contract = boot.contract.request(definition, entity)

  const stateful = definition.stateful === true

  /*
   * An endpoint beginning with `.` is the runtime's own rather than an operation — a lookup, an
   * exposition — so the safety of operations has nothing to say about it. `Component.invoke`
   * counts it as no hop in a call chain for the same reason.
   */
  const readable = endpoint[0] === '.' || safe(definition.type)

  return new Call(
    transmission,
    contract,
    `${locator.id}.${endpoint}`,
    source,
    stateful,
    readable
  )
}
