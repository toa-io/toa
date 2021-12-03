'use strict'

const dependencies = (context) => {
  const dependencies = map(context.connectors)

  if (context.extensions !== undefined) dependencies.push(...map(context.extensions))

  return dependencies
}

const map = (map) => {
  const list = []

  for (const [key, values] of Object.entries(map)) {
    const dependency = require(key)

    if (dependency.deployments !== undefined) {
      list.push(...dependency.deployments(values))
    }
  }

  return list
}

exports.dependencies = dependencies
