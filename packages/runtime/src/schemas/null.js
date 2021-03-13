'use strict'

class Null {
  fit (value) {
    let oh
    const ok = value === null

    if (!ok) oh = { message: 'Object must be null' }

    return { ok, oh }
  }

  defaults = () => null
}

exports.Null = Null
