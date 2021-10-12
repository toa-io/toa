'use strict'

const keywords = (validator) => {
  validator.addKeyword(system)
}

/*
System properties are:
- readonly
- always included in projection
 */
const system = {
  keyword: 'system',
  schemaType: 'boolean',
  modifying: true,
  errors: false,
  validate: (value, data, metadata, context) => {
    if (value === false) return true
    if (context.parentData === undefined || typeof context.parentData !== 'object') return true
    if (Object.isFrozen(context.parentData)) return true

    const propertyValue = context.parentData[context.parentDataProperty]

    Object.defineProperty(context.parentData, context.parentDataProperty, {
      get: () => propertyValue
    })

    return true
  }
}

exports.keywords = keywords
