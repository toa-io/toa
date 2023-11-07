'use strict'

const { join } = require('node:path')
const { createReadStream } = require('node:fs')

const lenna = join(__dirname, 'lenna.png')

async function diversify (input, context) {
  const stream = createReadStream(lenna)

  return context.storages[input.storage].diversify(input.path, 'hello.png', stream)
}

exports.effect = diversify
