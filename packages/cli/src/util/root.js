'use strict'

const path = require('path')
const findUp = require('find-up')

const MANIFEST = 'manifest.yaml'

function tryRoot (from = '.') {
  const current = process.cwd()

  process.chdir(from)

  const manifest = findUp.sync(MANIFEST)

  process.chdir(current)

  return manifest && path.dirname(manifest)
}

function root (from = '.') {
  const dir = tryRoot(from)

  if (!dir) { throw new Error(`Component manifest (${MANIFEST}) not found in ${from}`) }

  return dir
}

exports.root = root
exports.tryRoot = tryRoot
