'use strict'

function route (locator, operation, binding) {
  const path = binding?.path || def(operation)

  return `${locator.path}${path || ''}`
}

function def (operation) {
  if (operation.state === 'object') return '/:_id'
}

exports.route = route
