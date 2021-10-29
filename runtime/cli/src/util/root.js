'use strict'

const path = require('path')
const findUp = require('find-up')

const manifest = (from = '.') => {
  const manifest = findUp.sync(MANIFEST, { cwd: path.resolve(process.cwd(), from) })

  if (manifest === undefined) throw new Error(`File ${MANIFEST} not found in ${from}`)

  return manifest
}

const root = (from = '.') => path.dirname(manifest(from))

const MANIFEST = 'manifest.toa.yaml'

exports.root = root
exports.manifest = manifest
