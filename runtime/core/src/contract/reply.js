'use strict'

const { Conditions } = require('./conditions')
const { Exception } = require('./exception')

class Reply extends Conditions {
  static EXCEPTION = Exception.POSTCONDITION

  static schema = (output, error) => Conditions.schema({ output, error })
}

exports.Reply = Reply
