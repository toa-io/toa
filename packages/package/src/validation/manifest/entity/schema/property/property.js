'use strict'

const regex = /^[a-z]+([-a-z0-9]*[a-z0-9]+)?$/
const match = ({ key }) => key.match(regex) !== null
match.message = `one of entity schema properties does not match ${regex.toString()}`
match.fatal = true

const object = ({ properties, key }) => ['object', 'string'].includes(typeof properties[key])
object.message = 'entity schema properties must be objects'

const def = ({ properties, key }) => {
  if (typeof properties[key] === 'string') { properties[key] = { type: properties[key] } }
}

exports.checks = [match, object, def]
