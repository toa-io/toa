'use strict'

const { freeze } = require('@kookaburra/gears')

class Typed {
  constructor (schemas) {
    Object.entries(schemas).forEach(([key, schema]) => this.#extend(key, schema))
  }

  #extend (key, schema) {
    let value = null

    Object.defineProperty(this, key, {
      get: () => value,
      set: (val) => {
        const { ok, oh } = schema.fit(val)

        if (ok) { value = freeze(val) } else { throw oh }
      }
    })
  }
}

exports.Typed = Typed
