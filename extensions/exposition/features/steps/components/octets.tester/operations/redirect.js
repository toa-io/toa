function redirect (input) {
  return input.parameters.type in urls ? { url: urls[input.parameters.type] } : ERR_UNKNOWN
}

// an error a caller is meant to see carries a code, always
const ERR_UNKNOWN = new (class UnknownError extends Error {
  code = 'ERROR'
})()

const urls = {
  'rfc': 'https://www.rfc-editor.org/rfc/rfc9564.txt',
  'img': 'https://www.w3.org/assets/logos/w3c/w3c-no-bars.svg'
}

export { redirect as computation }
