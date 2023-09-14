'use strict'

function memo (fn) {
  return (...args) => {
    if (fn[symbol] !== undefined) return fn[symbol].result

    const result = fn(...args)

    fn[symbol] = { result }

    return result
  }
}

const symbol = Symbol('memo')

exports.memo = memo
