'use strict'

const boot = require('@kookaburra/boot')
const { console } = require('@kookaburra/gears')

const { root } = require('../util/root')

async function print (argv) {
  const manifest = await boot.manifest(root(argv.path))

  console.dir(manifest)
}

exports.manifest = print
