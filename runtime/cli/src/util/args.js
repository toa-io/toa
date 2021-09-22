'use strict'

const bindings = (argv) => {
  if (argv.bindings === 'null') return null

  let bindings

  if (argv.bindings !== undefined) {
    bindings = argv.bindings.map((binding) => {
      if (binding[0] === '@' && binding.indexOf('/') === -1) {
        binding = '@kookaburra/bindings.' + binding.substr(1)
      }

      return binding
    })
  }

  return bindings
}

exports.bindings = bindings
