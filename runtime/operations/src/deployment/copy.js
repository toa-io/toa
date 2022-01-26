'use strict'

const execa = require('execa')

const copy = async (source, target) => await execa('cp', ['-r', source, target])

exports.copy = copy
