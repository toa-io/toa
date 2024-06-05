'use strict'

const cos = require('@toa.io/concise')
const { is } = require('./validator')

function expand (object) {
  return cos.expand(object, is)
}

exports.expand = expand
