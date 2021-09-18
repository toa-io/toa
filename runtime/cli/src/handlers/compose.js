'use strict'

const boot = require('@kookaburra/boot')
const { root } = require('../util/root')

async function compose (argv) {
  const options = parse(argv)

  const paths = [...new Set(argv.paths.map(root))]
  const composition = await boot.composition(paths, options)

  await composition.connect()
}

const parse = (argv) => {
  const options = {}

  if (argv.bindings) {
    options.bindings = argv.bindings.map((binding) => {
      if (binding[0] === '@' && binding.indexOf('/') === -1) {
        binding = '@kookaburra/bindings.' + binding.substr(1)
      }

      return binding
    })
  }

  return options
}

exports.compose = compose
