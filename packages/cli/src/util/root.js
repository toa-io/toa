'use strict'

const path = require('path')
const findUp = require('find-up')

const MANIFEST = 'kookaburra.yaml'

function root () {
  const dir = path.dirname(findUp.sync(MANIFEST))

  if (!dir) { throw new Error(`Component manifest (${MANIFEST}) not found`) }

  return dir
}

exports.root = root
