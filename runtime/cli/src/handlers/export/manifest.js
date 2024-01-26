'use strict'

const { component } = require('@toa.io/norm')
const { console } = require('@toa.io/console')
const yaml = require('@toa.io/yaml')
const { definitions: loadDefinitions } = require('@toa.io/schema/source/definitions')

const { components: find } = require('../../util/find')

const print = async (argv) => {
  const path = find(argv.path)

  if (path === undefined) throw new Error(`No component found in ${argv.path}`)

  const manifest = await component(path)

  if (argv.error !== true) {
    // FIXME: workaround for unresolvable definitions references in the schema
    const defs = []
    loadDefinitions({
      addSchema: defs.push.bind(defs),
    })
    const { definitions, $id } = defs[0]
    const dereferenced = JSON.parse(JSON.stringify(manifest).replaceAll($id, ''))
    dereferenced.entity.schema.definitions = definitions
    const result = argv.output === 'json'
      ? JSON.stringify(dereferenced, null, 2)
      : yaml.dump(dereferenced)
    console.log(result)
  }
}

exports.manifest = print
