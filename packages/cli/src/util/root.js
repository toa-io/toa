'use strict'

const path = require('path')
const findUp = require('find-up')

const MANIFEST = 'kookaburra.yaml'

function tryRoot () {
  const manifest = findUp.sync(MANIFEST)
  return manifest && path.dirname(manifest)
}

function root () {
  const dir = tryRoot()

  if (!dir) { throw new Error(`Component manifest (${MANIFEST}) not found`) }

  return dir
}

exports.root = root
exports.tryRoot = tryRoot
