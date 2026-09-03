import * as uuid from 'uuid'

export function newid () {
  const buf = Buffer.alloc(16)

  uuid.v7(undefined, buf)

  return buf.toString('hex')
}
