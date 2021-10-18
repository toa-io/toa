'use strict'

const { exceptions: { RequestFormatException, RequestConflictException } } = require('@toa.io/core')
const { empty } = require('@toa.io/gears')

const request = (req, params) => {
  const request = {}

  if (!empty(req.body)) request.input = req.body
  if (!empty(req.query)) request.query = req.query

  if (!empty(params)) {
    if (req.method === 'POST') {
      if (request.input === undefined) request.input = {}

      for (const [key, value] of Object.entries(params)) {
        if (request.input[key] === undefined) request.input[key] = value
        else throw new RequestConflictException(`Input property '${key}' conflicts with path parameter`)
      }
    } else {
      const criteria = []

      if (request.query === undefined) request.query = {}

      for (const [key, value] of Object.entries(params)) {
        if (key === 'id') request.query.id = value
        else criteria.push(key + '==' + value)
      }

      if (criteria.length > 0) {
        const value = criteria.join(';')

        if (request.query.criteria === undefined) request.query.criteria = value
        else request.query.criteria = value + ';' + request.query.criteria
      }
    }
  }

  const etag = req.get('if-match')

  if (etag !== undefined && etag !== '*') {
    const match = etag.match(ETAG)
    const value = match?.[1]

    if (match === null) throw new RequestFormatException('ETag value must match ' + ETAG)
    if (request.query === undefined) request.query = {}

    request.query.version = +value
  }

  return request
}

const ETAG = /^"([^"]+)"$/

exports.request = request
