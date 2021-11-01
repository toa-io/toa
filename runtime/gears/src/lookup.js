'use strict'

const { dirname, resolve, join } = require('node:path')
const { accessSync } = require('node:fs')

const lookup = (reference, base) => {
  if (KNOWN[reference]) reference = KNOWN[reference]

  try {
    require.resolve(reference, { paths: [base, __dirname] }) // will throw if not exists

    const path = require.resolve(join(reference, './package.json'), { paths: [base, __dirname] })
    return dirname(path)
  } catch (e) {
    const path = resolve(base, reference)

    accessSync(path) // will throw if not exists

    return path
  }
}

const KNOWN = {
  http: '@toa.io/bindings.http',
  amqp: '@toa.io/bindings.amqp',
  resources: '@toa.io/extensions.resources'
}

exports.lookup = lookup
