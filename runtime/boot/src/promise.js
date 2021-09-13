'use strict'

/*
 Simultaneous creation of multiple compositions with common remotes may cause resolution conflicts.

 In fact, it can happen only within integration tests, so let's just avoid the problem by creating compositions
 successively.
*/

const promises = {}
const resolutions = {}

const promise = (name) => {
  if (!promises[name]) promises[name] = new Promise((resolve) => (resolutions[name] = resolve))

  return promises[name]
}

const resolve = (callback) => Object.entries(resolutions).map(([name, resolve]) => callback(name, resolve))

exports.promise = promise
exports.resolve = resolve
