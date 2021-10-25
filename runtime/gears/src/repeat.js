'use strict'

const repeat = (fn, times) => {
  const results = []
  let promise = false

  for (let i = 0; i < times; i++) {
    const result = fn(i)

    if (result instanceof Promise) promise = true

    results.push(result)
  }

  return promise ? Promise.all(results) : results
}

exports.repeat = repeat
