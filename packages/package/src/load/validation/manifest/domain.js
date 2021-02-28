const defined = manifest => manifest.domain !== undefined
defined.message = 'missing \'domain\' property. If this is intended use null as domain value.'

exports.checks = [defined]
