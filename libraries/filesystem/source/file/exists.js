'use strict'

const { stat } = require('node:fs')

const exists = async (file) => {
  return new Promise((resolve, reject) => {
    stat(file, (err) => {
      if (err === null) {
        resolve(true)
      } else if (err.code === 'ENOENT') {
        // file does not exist
        resolve(false)
      } else {
        reject(err)
      }
    })
  })
}

exports.exists = exists
