function defined (manifest) {
  return manifest.domain !== undefined
}

defined.description = 'Component \'%name%\' manifest missing \'domain\' property. If this is intended use null as domain value.'

exports.checks = [defined]
