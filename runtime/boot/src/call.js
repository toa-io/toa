import { Call, Transmission } from '@toa.io/core'

import * as boot from './index.js'

// eslint-disable-next-line max-params
const call = (locator, endpoint, definition, entity, source) => {
  const consumers = boot.bindings.consume(locator, endpoint, definition.bindings)
  const transmission = new Transmission(consumers)
  const contract = boot.contract.request(definition, entity)

  return new Call(transmission, contract, source)
}

export { call }
