'use strict'

const { component } = require('@toa.io/norm')
const { console } = require('@toa.io/console')
const yaml = require('@toa.io/yaml')

const { components: find } = require('../../util/find')

const print = async (argv) => {
  const path = find(argv.path)

  if (path === undefined) throw new Error(`No component found in ${argv.path}`)

  const manifest = await component(path)

  if (argv.error !== true) {
    const result = argv.output === 'json'
      ? JSON.stringify(manifest, null, 2)
      : yaml.dump(manifest)

    console.log(result)
  }
}

exports.manifest = print
