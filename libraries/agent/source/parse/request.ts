import { HTTPParser } from 'http-parser-js'

export function request (input: string): HTTPRequest {
  const parser = new HTTPParser(HTTPParser.REQUEST)
  const request: Partial<HTTPRequest> = {}
  const bodyChunks: Buffer[] = []

  let complete = false

  parser[HTTPParser.kOnHeadersComplete] = function (req) {
    request.method = HTTPParser.methods[req.method]
    request.url = req.url
    request.headers = reduceHeaders(req.headers)
  }

  parser[HTTPParser.kOnBody] = function (chunk, offset, length) {
    bodyChunks.push(chunk.subarray(offset, offset + length))
  }

  parser[HTTPParser.kOnMessageComplete] = function () {
    complete = true
  }

  const buffer = Buffer.from(input)

  parser.execute(buffer)
  parser.finish()

  if (!complete) throw new Error('Failed to parse the request')

  if (bodyChunks.length > 0)
    request.body = Buffer.concat(bodyChunks)

  return request as HTTPRequest
}

function reduceHeaders (array: string[]): Headers {
  const headers = new Headers()

  while (array.length > 1) {
    const name = array.shift()
    const value = array.shift()

    if (name === undefined || value === undefined) throw new Error('Error parsing headers')

    headers.append(name, value)
  }

  return headers
}

interface HTTPRequest {
  url: string
  method: string
  headers: Headers
  body?: Buffer
}
