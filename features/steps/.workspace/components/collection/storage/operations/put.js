'use strict'

const { join } = require('node:path')
const fs = require('node:fs')

function effect (input, context) {
  const path = join(__dirname, 'lenna.ascii')
  const stream = fs.createReadStream(path)

  return context.storages[input.storage].put(input.path, stream)
}

exports.effect = effect
