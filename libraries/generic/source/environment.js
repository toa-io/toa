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
    if (name === SUFFIX) forget()

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
    if (name === SUFFIX) forget()

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

      // a `.env` is read as the process boots, so what it says is the suffix the process has
      if (name === SUFFIX) forget()

      if (own(name)) store[name] = value
      else process.env[name] = value
    }
  },

  /**
   * `TOA_SUFFIX`, as it was the first time it was asked for.
   *
   * A process names what it keeps on shared infrastructure at different moments — a connector
   * when it is made, a broadcast when it is sent — so a suffix that changed while it ran would
   * split it across two scopes. And a process that starts others sets `process.env.TOA_SUFFIX`
   * for them, which must not move it. The boot asks for it once `.env` is loaded, and it is read
   * again only where it is `set` or deleted here — which is how a test changes it.
   *
   * @returns {string | undefined}
   */
  suffix() {
    if (!(SUFFIX in taken)) taken[SUFFIX] = read()

    return taken[SUFFIX]
  },

  /**
   * What this process names its database, its keys and — under a suffix — its exchanges and
   * queues after: the context, followed by the suffix with nothing between them.
   *
   * @returns {string}
   */
  scope() {
    const context = environment.get('TOA_CONTEXT') ?? development()

    return context + (environment.suffix() ?? '')
  }
}

/**
 * @param {string} name
 * @returns {boolean}
 */
const own = (name) => name.startsWith(PREFIX)

const PREFIX = 'TOA_'

const SUFFIX = 'TOA_SUFFIX'

/** what a suffix may hold: it is a part of a database name, of an exchange's and of a key */
const NAME = /^[a-zA-Z0-9-]+$/

/**
 * @returns {string | undefined}
 */
function read() {
  const value = environment.get(SUFFIX)

  if (value !== undefined && !NAME.test(value))
    throw new Error(
      `Environment variable ${SUFFIX} may hold letters, digits and hyphens, '${value}' given`
    )

  return value
}

function forget() {
  delete taken[SUFFIX]
}

/** @returns {string} */
function development() {
  if (environment.get('TOA_DEV') === '1') return 'toa-dev'

  throw new Error('Environment variable TOA_CONTEXT is not defined')
}

const SHARED = Symbol.for('toa.environment')
const TAKEN = Symbol.for('toa.environment.taken')

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

/**
 * What has been read once and is kept, shared by every copy of this package for the reason the
 * store is.
 *
 * @type {Record<string, string | undefined>}
 */
const taken = (globalThis[TAKEN] ??= {})

environment.absorb()
