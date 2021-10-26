'use strict'

const { exceptions: { codes } } = require('@toa.io/core')

const etag = require('./etag')

/** @hot */
const ok = (reply, res, req) => {
  if (reply.output?._version !== undefined) {
    const { _version, ...output } = reply.output

    res.set('etag', etag.set(_version))
    reply.output = output

    const condition = req.get('if-none-match')

    if (condition !== undefined && req.safe) {
      const value = etag.get(condition)

      if (value === _version) {
        res.status(304).end()
        return
      }
    }
  }

  let status

  if (req.method === 'POST') status = 201
  else if (reply.output !== undefined || reply.error !== undefined) status = 200
  else status = 204

  res.status(status)
  if (status !== 204) res.send(reply)
}

const missed = (response) => response.status(404)

const exception = (exception, response) => {
  const status = STATUSES[exception.code] || 500

  response.status(status)
  response.send(exception)
}

const STATUSES = {
  [codes.RequestContract]: 400,
  [codes.RequestSyntax]: 400,
  [codes.QuerySyntax]: 400,
  [codes.RequestConflict]: 403,
  [codes.StateNotFound]: 404,
  [codes.NotImplemented]: 405,
  [codes.StatePrecondition]: 412
}

exports.ok = ok
exports.missed = missed
exports.exception = exception
