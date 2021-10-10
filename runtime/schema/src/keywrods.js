'use strict'

const keywords = (validator) => {
  validator.addKeyword({
    keyword: 'system',
    schemaType: 'boolean',
    modifying: true,
    validate: (value, data, metadata, context) => {
      if (value === false) return true
      if (context.parentData === undefined || typeof context.parentData !== 'object') return true

      const propertyValue = context.parentData[context.parentDataProperty]

      Object.defineProperty(context.parentData, context.parentDataProperty, {
        get: () => propertyValue
      })

      return true
    }
  })
}

exports.keywords = keywords
