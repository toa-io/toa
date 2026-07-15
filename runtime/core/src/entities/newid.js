const uuid = require('uuid')

function newid () {
  const buf = Buffer.alloc(16)

  uuid.v7(undefined, buf)

  return buf.toString('hex')
}

module.exports = { newid }
