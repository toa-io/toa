import { LOOP } from './constants.js'
import { factory } from './factory.js'
import { carries } from './produce.js'

export const consume = async (locator, endpoint, bindings, streamed = false) => {
  const declared = [LOOP].concat(bindings)
  const carrying = streamed ? await filter(declared) : declared

  return await Promise.all(
    carrying.map(async (binding) => (await factory(binding)).consumer(locator, endpoint))
  )
}

/** A call that carries a stream is handed to nothing that cannot carry one. */
const filter = async (bindings) => {
  const carrying = []

  for (const binding of bindings) if (await carries(binding)) carrying.push(binding)

  return carrying
}
