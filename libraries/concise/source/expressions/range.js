'use strict'

/**
 * @param {string} value
 * @returns {object | null}
 */
function range (value) {
  if (typeof value !== 'string')
    return null

  const match = value.match(RX)

  if (match === null)
    return null

  const schema = { type: match.groups.type }
  const parse = PARSERS[schema.type]

  if (match.groups.min !== '') {
    const keyword = value[schema.type.length] === '[' ? 'minimum' : 'exclusiveMinimum'

    schema[keyword] = parse(match.groups.min)
  }

  if (match.groups.max !== '') {
    const keyword = value[value.length - 1] === ']' ? 'maximum' : 'exclusiveMaximum'

    schema[keyword] = parse(match.groups.max)
  }

  return schema
}

const PARSERS = {
  'integer': Number.parseInt,
  'number': Number.parseFloat
}

const RX = /^(?<type>integer|number)[[(]\s?(?<min>[\d.]{0,32})\s?,\s?(?<max>[\d.]{0,32})\s?[)\]]$/

exports.range = range
