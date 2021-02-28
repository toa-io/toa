const def = (manifest) => manifest.operations ?? (manifest.operations = [])

const array = (manifest) => Array.isArray(manifest.operations)
array.message = '.operations must be an array'
array.fatal = true

exports.checks = [def, array]
