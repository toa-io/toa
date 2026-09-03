import { AsyncLocalStorage } from 'node:async_hooks'

/** @type {toa.generic.Context} */
export const context = (id) => {
  if (instances[id] === undefined) instances[id] = new Storage()

  return instances[id]
}

const instances = {}

/**
 * @implements {toa.generic.context.Storage}
 */
class Storage {
  #storage

  constructor () {
    this.#storage = new AsyncLocalStorage()
  }

  async apply (value, func) {
    return this.#storage.run(value, func)
  }

  get () {
    return this.#storage.getStore()
  }
}
