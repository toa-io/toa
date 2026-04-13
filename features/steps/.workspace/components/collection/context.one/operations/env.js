function computation(_, context) {
  return { env: context.env, context: context.name }
}

module.exports = { computation }
