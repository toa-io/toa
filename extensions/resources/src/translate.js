'use strict'

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

exports.translate = translate
