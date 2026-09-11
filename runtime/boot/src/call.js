import { Call, Transmission } from '@toa.io/core'

import * as boot from './index.js'

// eslint-disable-next-line max-params
export const call = async (locator, endpoint, definition, entity, source) => {
  const consumers = await boot.bindings.consume(locator, endpoint, definition.bindings)
  const transmission = new Transmission(consumers)
  const contract = boot.contract.request(definition, entity)

  const stateful = definition.stateful === true

  return new Call(transmission, contract, `${locator.id}.${endpoint}`, source, stateful)
}
