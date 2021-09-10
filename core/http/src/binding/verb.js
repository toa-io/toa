'use strict'

function verb (operation) {
  if (operation.type === 'observation') { return VERBS.GET }
  if (operation.state === 'object') { return VERBS.PUT }
  return VERBS.POST
}

const VERBS = {
  GET: 'GET',
  PUT: 'PUT',
  POST: 'POST',
  DELETE: 'DELETE'
}

exports.verb = verb
