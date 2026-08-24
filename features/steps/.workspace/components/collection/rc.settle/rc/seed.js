async function settle (context) {
  await context.local.seed()
}

exports.settle = settle
