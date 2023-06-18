import { HTTPParser } from 'http-parser-js'

export function request (input: string): Request {
  const parser = new HTTPParser(HTTPParser.REQUEST)
  const request: Partial<Request> = {}

  let complete = false

  parser[HTTPParser.kOnHeadersComplete] = function (req) {
    request.method = HTTPParser.methods[req.method]
    request.url = req.url
    request.headers = reduceHeaders(req.headers)
  }

  parser[HTTPParser.kOnMessageComplete] = function () {
    complete = true
  }

  const buffer = Buffer.from(input)

  parser.execute(buffer as any)
  parser.finish()

  if (!complete) throw new Error('Request is not complete')

  return request as Request
}

function reduceHeaders (array: string[]): Record<string, string> {
  const headers: Record<string, string> = {}

  while (array.length > 1) {
    const name = array.shift()
    const value = array.shift()

    if (name === undefined || value === undefined) throw new Error('Error parsing headers')

    headers[name] = value
  }

  return headers
}

export interface Request {
  url: string
  method: string
  headers: Record<string, string>
  body: Buffer
}
