'use strict'

async function redirect (input) {
  return urls[input.parameters.type] ?? new Error()
}

const urls = {
  'rfc': 'https://www.rfc-editor.org/rfc/rfc9564.txt',
  'img': 'https://picsum.photos/10'
}

exports.computation = redirect
