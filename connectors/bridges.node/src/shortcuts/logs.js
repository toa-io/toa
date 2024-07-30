'use strict'

function logs (context, aspect) {
  function invoke (severity) {
    return (message, attributes) => aspect.invoke(context.operation, severity, message, attributes)
  }

  context.logs = CHANNELS.reduce((logs, channel) => {
    logs[channel] = invoke(channel)

    return logs
  }, {})

  context.logs.fork = (ctx) => aspect.invoke(context.operation, 'fork', ctx)
}

const CHANNELS = ['debug', 'info', 'warn', 'error']

exports.logs = logs
