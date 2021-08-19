'use strict'

const { console } = require('@kookaburra/gears')

const output = (object, argv) => {
  if (argv.ugly) console.log(JSON.stringify(object))
  else console.dir(object)
}

exports.output = output
