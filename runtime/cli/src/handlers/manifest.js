'use strict'

const { manifest: load } = require('@toa.io/package')
const { console, yaml } = require('@toa.io/gears')

const { manifest: find } = require('../util/find')

const print = async (argv) => {
  const manifest = await load(find(argv.path))

  console.log(yaml.dump(manifest))
}

exports.manifest = print
