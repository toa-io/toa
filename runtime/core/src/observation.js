import { Operation } from './operation.js'

class Observation extends Operation {
  async run (store) {
    if (store.scope === null || (store.scope?.deleted === true && store.request.query?.options?.deleted !== true)) store.reply = null
    else await super.run(store)
  }
}

export { Observation }
