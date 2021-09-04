'use strict'

const defined = () => true
defined.break = (operation) => operation.schemas.criteria !== undefined

const criteria = () => true
criteria.break = (operation) => operation.query?.criteria === undefined || operation.query?.criteria === null

exports.checks = [defined, criteria]
