'use strict'

const { map } = require('@toa.io/generic')

const types = {
  Map: require('./map'),
  Set: require('./set'),
  sync: require('./sync'),
  async: require('./async')
}

function cast (value) {
  return map(value, replace)
}

function replace (key, value) {
  const [name, type] = key.split(':')

  if (!(type in types)) return

  const typed = types[type](value)

  return [name, typed]
}

exports.cast = cast
