'use strict'

async function observe (_, object) {
  return { output: object }
}

exports.observation = observe
