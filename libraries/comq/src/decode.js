'use strict'

const decoders = require('./.encoders')

/**
 * @param {import('amqplib').ConsumeMessage} message
 * @returns {any}
 */
const decode = (message) => {
  const type = message.properties.contentType

  if (type === undefined || !(type in decoders)) return message.content

  return decoders[type].decode(message.content)
}

exports.decode = decode
