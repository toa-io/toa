'use strict'

const path = require('path')

const { validation } = require('./validation/validation')

const validate = validation(path.resolve(__dirname, './validation/rules'))

exports.validate = validate
