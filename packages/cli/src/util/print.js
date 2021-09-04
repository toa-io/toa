'use strict'

const { console } = require('@kookaburra/gears')

const print = (object, argv) => {
  if (argv.ugly) console.log(JSON.stringify(object))
  else console.dir(object)
}

exports.print = print
