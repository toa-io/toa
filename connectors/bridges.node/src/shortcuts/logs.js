'use strict'

function logs (context, aspect) {
  function invoke (severity) {
    return (message, attributes) => aspect.invoke(context.operation, severity, message, attributes)
  }

  context.logs = CHANNELS.reduce((logs, channel) => {
    logs[channel] = invoke(channel)

    return logs
  }, {})
}

const CHANNELS = ['debug', 'info', 'warn', 'error']

exports.logs = logs
