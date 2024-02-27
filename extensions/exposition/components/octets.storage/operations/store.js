'use strict'

function store (input, context) {
  const { storage, request, accept, meta } = input
  const path = request.url
  const claim = request.headers['content-type']

  return context.storages[storage].put(path, request, { claim, accept, meta })
}

exports.effect = store
