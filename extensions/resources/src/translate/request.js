'use strict'

const { exceptions: { RequestFormatException, RequestConflictException } } = require('@toa.io/core')
const { empty } = require('@toa.io/gears')

const request = (req, match) => {
  const request = {}
  const etag = req.get('if-match')

  let id

  if (!empty(req.body)) request.input = req.body
  if (!empty(req.query)) request.query = req.query

  if (!empty(match.params)) {
    if (req.safe) {
      const criteria = []

      if (request.query === undefined) request.query = {}

      for (const [key, value] of Object.entries(match.params)) {
        if (key === 'id') id = value
        else criteria.push(key + '==' + value)
      }

      if (criteria.length) {
        const value = criteria.join(';')

        if (request.query.criteria === undefined) request.query.criteria = value
        else request.query.criteria = value + ';' + request.query.criteria
      }
    } else {
      if (request.input === undefined) request.input = {}

      for (const [key, value] of Object.entries(match.params)) {
        if (key === 'id') id = value
        else if (request.input[key] !== undefined) {
          throw new RequestConflictException(`Input property '${key}' conflicts with path parameter`)
        } else request.input[key] = value
      }
    }
  }

  if (id !== undefined) {
    if (request.query === undefined) request.query = { id }
    else request.query.id = id
  }

  if (etag !== undefined && etag !== '*') {
    const match = etag.match(ETAG)
    const value = match?.[1]

    if (match === null) throw new RequestFormatException(`ETag value must match ${ETAG}`)
    if (request.query === undefined) request.query = {}

    request.query.version = +value
  }

  return request
}

const ETAG = /^"([^"]+)"$/

exports.request = request
