'use strict'

const { exceptions: { codes } } = require('@toa.io/core')

const translate = (reply, response) => {
  if (reply.exception === undefined) return ok(reply, response)
}

const ok = (reply, response) => {
  if (reply.output?._version !== undefined) {
    const { _version, ...output } = reply.output

    response.set('etag', '"' + _version + '"')
    reply.output = output
  }

  response.status(200)
  response.send(reply)
}

translate.mismatch = (response) => {
  response.status(404)
}

translate.exception = (exception, response) => {
  if (exception.code === codes.RequestContract) response.status(400)
  else response.status(500)

  response.send(exception)
}

exports.translate = translate
