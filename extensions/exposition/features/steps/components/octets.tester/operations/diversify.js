'use strict'

const { join } = require('node:path')
const { createReadStream } = require('node:fs')

const lenna = join(__dirname, 'lenna.png')

async function diversify (input, context) {
  const stream = createReadStream(lenna)

  await context.storages[input.storage].diversify(input.path, 'hello.png', stream)

  return 'hello'
}

exports.effect = diversify
