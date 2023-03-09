'use strict'

/** @type {toa.generic.recall} */
const recall = (context, method = undefined) => {
  if (method === undefined) return replay(context)
  else return recorder(context, method)
}

const recorder = (context, method) => async (...args) => {
  if (context[METHODS] === undefined) context[METHODS] = []

  if (method[CALLS] === undefined) {
    context[METHODS].push(method)
    method[CALLS] = []
  }

  const result = await method.apply(context, args)

  method[CALLS].push(args)

  return result
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
