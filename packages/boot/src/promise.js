'use strict'

const promises = {}
const resolutions = {}

const promise = (name) => {
  if (!promises[name]) promises[name] = new Promise((resolve) => (resolutions[name] = resolve))

  return promises[name]
}

const resolve = (callback) => Object.entries(resolutions).map(([name, resolve]) => callback(name, resolve))

exports.promise = promise
exports.resolve = resolve
