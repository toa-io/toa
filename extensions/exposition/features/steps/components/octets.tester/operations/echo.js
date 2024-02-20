'use strict'

async function baz (input) {
  return input.entry.id
}

exports.computation = baz
