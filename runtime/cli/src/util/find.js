'use strict'

const { dirname, resolve } = require('node:path')
const findUp = require('find-up')

const find = (from = '.', filename) => {
  const path = findUp.sync(filename, { cwd: resolve(process.cwd(), from) })

  if (path === undefined) throw new Error(`File ${filename} not found in ${from}`)

  return dirname(path)
}

const manifest = (from = '.') => find(from, MANIFEST)
const context = (from = '.') => find(from, CONTEXT)

const MANIFEST = 'manifest.toa.yaml'
const CONTEXT = 'context.toa.yaml'

exports.manifest = manifest
exports.context = context
