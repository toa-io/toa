'use strict'

async function buffer (stream) {
  const chunks = []

  for await (const chunk of stream) chunks.push(chunk)

  return Buffer.concat(chunks)
}

exports.buffer = buffer
