'use strict'

const { exceptions: { codes } } = require('@toa.io/core')

const ok = (reply, response, request) => {
  if (reply.output?._version !== undefined) {
    const { _version, ...output } = reply.output

    response.set('etag', '"' + _version + '"')
    reply.output = output
  }

  response.status(request.method === 'POST' ? 201 : 200)
  response.send(reply)
}

const missed = (response) => response.status(404)

const exception = (exception, response) => {
  const status = STATUSES[exception.code] || 500

  response.status(status)
  response.send(exception)
}

const STATUSES = {
  [codes.RequestContract]: 400,
  [codes.RequestFormat]: 400,
  [codes.RequestConflict]: 403,
  [codes.StateNotFound]: 404,
  [codes.NotImplemented]: 405,
  [codes.StatePrecondition]: 412
}

exports.ok = ok
exports.missed = missed
exports.exception = exception
