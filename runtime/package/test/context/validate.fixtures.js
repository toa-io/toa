'use strict'

const context = {
  runtime: '0.0.0',
  name: 'test',
  description: 'context fixture',
  version: '0.0.0',
  packages: 'domains/**/*',
  compositions: [['foo'], ['bar']]
}

exports.context = context
