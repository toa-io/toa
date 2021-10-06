'use strict'

const repeat = (fn, times) => {
  const results = []
  let promise = false

  for (let i = times; i > 0; i--) {
    const result = fn()

    if (result instanceof Promise) promise = true

    results.push(result)
  }

  return promise ? Promise.all(results) : results
}

exports.repeat = repeat
