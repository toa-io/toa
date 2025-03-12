class Console {
  logs

  constructor (context) {
    this.logs = context.logs
  }

  send (message) {
    this.logs.debug('Email kinda sent', message)
  }
}

exports.Console = Console
