'use strict'

async function assign (input, changeset) {
  Object.assign(changeset, input)
}

exports.assignment = assign
