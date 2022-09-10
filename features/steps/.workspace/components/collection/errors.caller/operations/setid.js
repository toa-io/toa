'use strict'

async function transition (input, object) {
  object.id = 'should be readonly'
}

exports.transition = transition
