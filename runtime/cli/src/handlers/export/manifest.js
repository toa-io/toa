'use strict'

const { component } = require('@toa.io/norm')
const { dump } = require('@toa.io/libraries/yaml')
const { console } = require('@toa.io/libraries/console')

const { component: find } = require('../../util/find')

const print = async (argv) => {
  const path = find(argv.path)

  if (path === undefined) throw new Error(`No component found in ${argv.path}`)

  const manifest = await component(path)

  if (argv.error !== true) console.log(dump(manifest))
}

exports.manifest = print
