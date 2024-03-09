'use strict'

function terminate (_, changeset) {
  changeset._deleted = Date.now()
}

exports.assignment = terminate
