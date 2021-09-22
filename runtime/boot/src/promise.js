'use strict'

/*
 Simultaneous creation of multiple compositions with common remotes may cause resolution conflicts.

 In fact, it can happen only within integration tests, so let's just avoid the problem by creating compositions
 sequentially.
*/

const promises = {}
const resolutions = {}

const promise = (kind, name) => {
  if (!promises[kind]) {
    promises[kind] = {}
    resolutions[kind] = {}
  }

  if (!promises[kind][name]) {
    promises[kind][name] = new Promise((resolve) => (resolutions[kind][name] = resolve))
  }

  return promises[kind][name]
}

const resolve = async (kind, callback) => {
  if (!resolutions[kind]) return []

  const promises = Object.entries(resolutions[kind]).map(([name, resolve]) => callback(name, resolve))

  return Promise.all(promises)
}

exports.promise = promise
exports.resolve = resolve
