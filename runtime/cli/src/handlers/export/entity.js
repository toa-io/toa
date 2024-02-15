'use strict'

const { component } = require('@toa.io/norm')
const { console } = require('@toa.io/console')
const yaml = require('@toa.io/yaml')

const { components: find } = require('../../util/find')

const print = async (argv) => {
  const path = find(argv.path)

  if (path === undefined) throw new Error(`No component found in ${argv.path}`)

  const manifest = await component(path)
  const entity = manifest.entity

  if (entity === undefined)
    return

  const result = argv.output === 'json'
    ? JSON.stringify(entity, null, 2)
    : yaml.dump(entity)

  console.log(result)
}

exports.manifest = print
