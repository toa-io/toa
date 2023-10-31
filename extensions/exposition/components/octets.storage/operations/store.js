'use strict'

function store (input, context) {
  const { storage, request } = input
  const path = request.path
  const type = request.headers['content-type']

  return context.storages[storage].put(path, request, type)
}

exports.effect = store
