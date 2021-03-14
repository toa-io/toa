'use strict'

const path = require('path')

const { validation } = require('../validation')

const defined = () => true
defined.break = (manifest) => manifest.entity === undefined

const entity = (manifest) => validation(path.resolve(__dirname, './entity'))(manifest.entity, manifest)

exports.checks = [defined, entity]
