'use strict'

const defined = (query) => query.criteria !== undefined
defined.fatal = false
defined.message = (query, operation) =>
  `operation '${operation.name}' query.criteria is not defined. If this is intended use null as query value.`
defined.break = (query) => !defined(query)

const string = (query) => {
  if (typeof query.criteria === 'string') query.criteria = { [query.criteria]: null }
}

const array = (query) => {
  if (Array.isArray(query.criteria)) query.criteria = Object.fromEntries(query.criteria.map(name => [name, null]))
}

exports.checks = [defined, string, array]
