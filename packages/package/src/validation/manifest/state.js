'use strict'

const path = require('path')

const { validation } = require('../validation')

const defined = () => undefined
defined.break = (manifest) => manifest.state === undefined

const state = async (manifest) => await validation(path.resolve(__dirname, './state'))(manifest.state, manifest)

exports.checks = [defined, state]
