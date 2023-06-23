'use strict'

const fs = require('fs-extra')

const copy = async (source, target) => {
  await fs.copy(source, target)
}

exports.copy = copy
