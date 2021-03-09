'use strict'

const regex = /^[a-z]+([-a-z0-9]*[a-z0-9]+)?$/
const match = ({ key }) => key.match(regex) !== null
match.message = `one of entity schema properties does not match ${regex.toString()}`
match.fatal = true

const expand = ({ properties, key }) => {
  if (typeof properties[key] === 'string') { properties[key] = { type: properties[key] } }
}

exports.checks = [match, expand]
