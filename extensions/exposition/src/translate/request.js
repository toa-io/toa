'use strict'

const { exceptions: { RequestSyntaxException, RequestConflictException } } = require('@toa.io/core')
const { empty } = require('@toa.io/libraries.generic')

const etag = require('./etag')

/**
 * @hot
 *
 * @param {import('express').Request} req
 * @param {{[key: string]: string}} params
 * @returns {toa.core.Request}
 */
const request = (req, params) => {
  const request = {}

  if (!empty(req.body)) request.input = req.body

  if (!empty(req.query)) {
    request.query = req.query

    if (request.query.projection !== undefined) request.query.projection = request.query.projection.split(',')
    if (request.query.sort !== undefined) request.query.sort = request.query.sort.split(',')
  }

  if (!empty(params)) {
    if (req.method === 'POST') {
      if (request.input === undefined) request.input = {}

      for (const [key, value] of Object.entries(params)) {
        if (request.input[key] === undefined) request.input[key] = value
        else throw new RequestConflictException(`Input property '${key}' conflicts with path parameter`)
      }
    } else {
      const criteria = []

      if (request.query === undefined) request.query = {}

      for (const [key, value] of Object.entries(params)) {
        if (key === 'id') request.query.id = value
        else criteria.push(key + '==' + value)
      }

      if (criteria.length > 0) {
        const value = criteria.join(';')

        if (request.query.criteria === undefined) request.query.criteria = value
        else request.query.criteria = value + ';' + request.query.criteria
      }
    }
  }

  const condition = req.get('if-match')

  if (condition !== undefined && condition !== '*') {
    const value = etag.get(condition)

    if (value === null) throw new RequestSyntaxException('ETag value must match ' + etag.rx)
    if (request.query === undefined) request.query = {}

    request.query.version = +value
  }

  return request
}

exports.request = request
