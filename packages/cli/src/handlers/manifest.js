'use strict'

const { load } = require('@kookaburra/package')
const { console, yaml } = require('@kookaburra/gears')

const { root } = require('../util/root')

async function print (argv) {
  const manifest = await load(root(argv.path))

  console.log(yaml.dump(manifest))
}

exports.manifest = print
