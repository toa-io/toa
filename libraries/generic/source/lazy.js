'use strict'

/** @type {toa.generic.lazy} */
const lazy = (context, initializers, method) => {
  if (context[LOCK] === undefined) context[LOCK] = Symbol('methods locking key')
  if (!Array.isArray(initializers)) initializers = [initializers]

  return async function (...args) {
    const override = await call(context, initializers, args)

    if (override !== undefined) args.splice(0, override.length, ...override)

    return method.apply(this, args)
  }
}

/**
 * @param {object} context
 * @param {Function[]} initializers
 * @param {any[]} args
 * @returns {Promise<any[]>}
 */
const call = async (context, initializers, args) => {
  let override

  for (const init of initializers) {
    const result = await resolve(context, init, args)

    if (result !== undefined) override = result
  }

  return override
}

/**
 * @param {object} context
 * @param {Function} init
 * @param {any[]} args
 * @returns {Promise}
 */
const resolve = (context, init, args) => {
  const key = context[LOCK]
  const expected = args.slice(0, init.length)

  return lock(context, init, expected, key)
}

/**
 * @param {object} context
 * @param {Function} init
 * @param {any[]} args
 * @param {Symbol} key
 * @returns {Promise}
 */
const lock = (context, init, args, key) => {
  if (init[key] === undefined) init[key] = []

  const locks = init[key]
  const found = locks.find((lock) => lock.args.reduce((match, argument, i) => match && argument === args[i], true))

  if (found !== undefined) return found.promise

  const promise = init.apply(context, args)
  const lock = { args, promise }

  locks.push(lock)

  return promise
}

const reset = (context) => {
  context[LOCK] = context[LOCK] = Symbol('methods locking key')
}

const LOCK = Symbol('context locking key')

lazy.reset = reset

exports.lazy = /** @type {toa.generic.Lazy} */ lazy
