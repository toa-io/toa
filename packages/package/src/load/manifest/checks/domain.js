function defined (manifest) {
  return manifest.domain !== undefined
}

defined.description = '.domain property is not set for component %name%. If this is intended use null as domain value.'

exports.checks = [defined]
