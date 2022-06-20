'use strict'

const { component } = require('@toa.io/formation')
const { console, yaml } = require('@toa.io/gears')

const { component: find } = require('../../util/find')

const print = async (argv) => {
  const path = find(argv.path)

  if (path === undefined) throw new Error(`No component found in ${argv.path}`)

  const manifest = await component(path)

  console.log(yaml.dump(manifest))
}

exports.component = print
