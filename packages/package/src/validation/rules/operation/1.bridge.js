'use strict'

const def = (operation) => {
  if (operation.bridge === undefined) { operation.bridge = '@kookaburra/bridges.javascript.native' }
}

exports.checks = [def]
