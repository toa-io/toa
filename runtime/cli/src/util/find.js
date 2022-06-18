'use strict'

const { dirname, resolve } = require('node:path')
const findUp = require('find-up')

const find = (from, filename) => {
  if (from instanceof Array) {
    const found = new Set(from.map((path) => find(path, filename)))

    found.delete(undefined)

    return found.size > 0 ? [...found] : undefined
  }

  const path = findUp.sync(filename, { cwd: resolve(process.cwd(), from) })

  if (path === undefined) throw new Error(`Cannot find '${filename}' from '${from}'`)

  return dirname(path)
}

const manifest = (from) => find(from, MANIFEST)
const context = (from) => find(from, CONTEXT)

const MANIFEST = 'manifest.toa.yaml'
const CONTEXT = 'context.toa.yaml'

exports.manifest = manifest
exports.context = context
