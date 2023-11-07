'use strict'

function store (input, context) {
  const { storage, request } = input
  const path = request.path
  const claim = request.headers['content-type']

  return context.storages[storage].put(path, request, { claim, accept: input.accept })
}

exports.effect = store
