'use strict'

exports.condition = (origin, changeset) => changeset.balance === 0
exports.payload = (state) => ({ user: state.user })
