const defined = (property) => {
  const check = (manifest) => manifest[property] !== undefined
  check.message = `property '${property}' must be defined`
  check.fatal = true

  return check
}

const string = (property) => {
  const check = (manifest) => typeof manifest[property] === 'string'
  check.message = `property '${property}' must be a string`
  check.fatal = true

  return check
}

const match = (property, re = /^[a-z]+([-a-z0-9]*[a-z0-9]+)?$/) => {
  const check = (manifest) => manifest[property].match(re) !== null
  check.message = `property '${property}' must match ${re.toString()}`
  check.fatal = true

  return check
}

exports.defined = defined
exports.string = string
exports.match = match
