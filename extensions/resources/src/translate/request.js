'use strict'

const { exceptions: { RequestFormatException } } = require('@toa.io/core')
const { empty } = require('@toa.io/gears')

const request = (req, match) => {
  const request = {}
  const etag = req.get('if-match')

  let id, version

  if (etag !== undefined && etag !== '*') {
    const match = etag.match(ETAG)
    const value = match?.[1]

    if (match === null) throw new RequestFormatException(`ETag value must match ${ETAG}`)

    version = +value
  }

  if (!empty(req.body)) request.input = req.body
  if (!empty(req.query)) request.query = req.query

  if (!empty(match.params)) {
    if (request.query === undefined) request.query = {}

    for (const [key, value] of Object.entries(match.params)) {
      if (key === 'id') id = value
    }
  }

  if (id !== undefined || version !== undefined) {
    if (request.query === undefined) request.query = {}
    if (id !== undefined) request.query.id = id
    if (version !== undefined) request.query.version = version
  }

  return request
}

const ETAG = /^"([^"]+)"$/

exports.request = request
