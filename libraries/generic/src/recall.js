'use strict'

/** @type {toa.generic.recall} */
const recall = (context, method = undefined) => {
  if (method === undefined) return replay(context)
  else return record(context, method)
}

const record = (context, method) => (...args) => {
  if (context[METHODS] === undefined) context[METHODS] = []

  if (method[CALLS] === undefined) {
    context[METHODS].push(method)
    method[CALLS] = []
  }

  method[CALLS].push(args)

  return method.apply(context, args)
}

const replay = async (context) => {
  if (context[METHODS] === undefined) return

  const promises = []

  for (const method of context[METHODS]) {
    for (const args of method[CALLS]) {
      const promise = method.apply(context, args)

      promises.push(promise)
    }
  }

  await Promise.all(promises)
}

const METHODS = Symbol('context methods')
const CALLS = Symbol('method calls')

exports.recall = recall
