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
  switch (exception.code) {
    case codes.RequestContract:
      response.status(400)
      break
    case codes.StateNotFound:
      missed(response)
      break
    case codes.NotImplemented:
      response.status(405)
      break
    default:
      response.status(500)
  }

  response.send(exception)
}

exports.ok = ok
exports.missed = missed
exports.exception = exception
