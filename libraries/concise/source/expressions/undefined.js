'use strict'

function undef (value) {
  if (value !== 'undefined') return null
  else return {}
}

exports.undef = undef
