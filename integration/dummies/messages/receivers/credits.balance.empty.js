'use strict'

exports.condition = (payload) => payload.balance === 0
exports.request = (payload) => ({ input: { text: payload.user } })
