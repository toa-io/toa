/**
 * What the runtime was deployed with, held apart from `process.env`.
 *
 * A component's code runs in this process, and what it can read of the environment it can
 * also print, so a `TOA_*` variable is moved here the moment this package loads, and again
 * before any component is loaded. `get` still falls through to `process.env`: a value set
 * there and not yet absorbed — a unit test's — is read as it always was.
 */
export const environment = {
  /**
   * @param {string} name
   * @returns {string | undefined}
   */
  get: (name) => store[name] ?? process.env[name],

  /**
   * @param {string} name
   * @returns {boolean}
   */
  has: (name) => environment.get(name) !== undefined,

  /**
   * Everything readable, the store over `process.env`. A program a test starts is given
   * this as its environment, so it runs under what the suite set.
   *
   * @param {string} [prefix]
   * @returns {Record<string, string>}
   */
  entries(prefix = '') {
    /** @type {Record<string, string>} */
    const result = {}

    for (const source of [process.env, store])
      for (const [name, value] of Object.entries(source))
        if (name.startsWith(prefix) && value !== undefined) result[name] = value

    return result
  },

  /**
   * @param {string} name
   * @param {string} value
   */
  set(name, value) {
    if (!own(name)) {
      process.env[name] = value

      return
    }

    store[name] = value

    // so `get` answers what was just set, not what a test left in `process.env`
    delete process.env[name]
  },

  /**
   * @param {string} name
   */
  delete(name) {
    delete store[name]
    delete process.env[name]
  },

  /**
   * Moves every `TOA_*` variable out of `process.env`; a later value replaces an earlier one.
   */
  absorb() {
    for (const [name, value] of Object.entries(process.env)) {
      if (!own(name) || value === undefined) continue

      store[name] = value
      delete process.env[name]
    }
  },

  /**
   * What a `.env` file says. `dotenv` leaves a variable that is already set alone, and so
   * does this — wherever it is set.
   *
   * @param {Record<string, string>} record
   */
  absorbEntries(record) {
    for (const [name, value] of Object.entries(record)) {
      if (environment.has(name)) continue

      if (own(name)) store[name] = value
      else process.env[name] = value
    }
  }
}

/**
 * @param {string} name
 * @returns {boolean}
 */
const own = (name) => name.startsWith(PREFIX)

const PREFIX = 'TOA_'

const SHARED = Symbol.for('toa.environment')

/**
 * One store for the process, whatever copy of this package reads it. A service image
 * installs the extension beside the runtime rather than into it, so both are loaded and
 * each would otherwise hold a store of its own: the runtime's would absorb, and the
 * extension's would find neither its own value nor the one taken out of `process.env`.
 *
 * Nothing is given away by holding it here that importing this package did not already
 * give: what runs in this process was never kept from what the runtime holds — see
 * migrations/289.md.
 *
 * @type {Record<string, string>}
 */
const store = (globalThis[SHARED] ??= {})

environment.absorb()
