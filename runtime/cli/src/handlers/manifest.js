'use strict'

const { load } = require('@toa.io/package')
const { console, yaml } = require('@toa.io/gears')

const { root } = require('../util/root')

const print = async (argv) => {
  const manifest = await load(root(argv.path))

  console.log(yaml.dump(manifest))
}

exports.manifest = print
