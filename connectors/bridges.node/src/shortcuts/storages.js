'use strict'

const { underlay } = require('@toa.io/generic')

function storages (context, aspect) {
  context.storages = underlay(async (segs, args) => {
    if (segs.length < 2)
      throw new Error('Storages aspect expects at least 2 arguments')

    const [storage, method] = segs

    return aspect.invoke(storage, method, ...args)
  })
}

exports.storages = storages
