'use strict'

exports.request = (payload) => {
  const { foo, bar } = payload

  return { input: { foo, bar } }
}
