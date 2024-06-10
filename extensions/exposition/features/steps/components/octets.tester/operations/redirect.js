'use strict'

async function redirect (input) {
  return urls[input.parameters.type] ?? new Error()
}

const urls = {
  'rfc': 'https://www.rfc-editor.org/rfc/rfc9564.txt',
  'img': 'https://www.w3.org/assets/logos/w3c/w3c-no-bars.svg'
}

exports.computation = redirect
