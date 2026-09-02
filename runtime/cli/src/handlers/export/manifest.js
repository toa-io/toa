'use strict'

const jsonpath = require('jsonpath')
const { component } = require('@toa.io/norm')
const jsyaml = require('js-yaml')

const { components: find } = require('../../util/find')

const print = async (argv) => {
  const path = find(argv.path)

  if (path === undefined) throw new Error(`No component found in ${argv.path}`)

  let manifest = await component(path)

  if (argv.jsonpath !== undefined)
    manifest = jsonpath.value(manifest, argv.jsonpath)

  if (argv.error !== true) {
    // js-yaml writes plain objects only, and a manifest carries a Locator
    const plain = JSON.parse(JSON.stringify(manifest))

    const result = argv.output === 'json'
      ? JSON.stringify(plain, null, 2)
      : jsyaml.dump(plain, { noRefs: true, lineWidth: -1 })

    console.log(result)
  }
}

exports.manifest = print
