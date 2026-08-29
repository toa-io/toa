const calls = []

async function preflight () {
  calls.push('preflight')
}

async function settle () {
  calls.push('settle')
}

async function dispose () {
  calls.push('dispose')
}

module.exports = { preflight, settle, dispose, calls }
