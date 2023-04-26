'use strict'

const schemas = require('@toa.io/schemas')

const namespace = schemas.namespace(__dirname)

exports.manifest = namespace.schema('manifest')
exports.annotations = namespace.schema('annotations')
