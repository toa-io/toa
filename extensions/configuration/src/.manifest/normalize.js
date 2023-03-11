'use strict'

const { traverse } = require('@toa.io/generic')
const { verbose } = require('./.normalize/verbose')

const normalize = (manifest) => {
  if (manifest.properties === undefined) manifest = expand(manifest)

  return manifest
}

const expand = (concise) => {
  return traverse(concise, verbose)
}

exports.normalize = normalize
