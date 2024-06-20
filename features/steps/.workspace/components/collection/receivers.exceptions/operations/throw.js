'use strict'

exports.effect = (input) => {
  if (input.bar === 'throw')
    throw new Error('Event processing exception')
}
