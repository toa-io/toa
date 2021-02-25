const { Invocation, Schema } = require('@kookaburra/runtime')

const invocation = ({ operation, manifest }) => {
  const schema = manifest.schema ? new Schema(manifest.schema) : undefined

  return new Invocation(operation, schema)
}

exports.invocation = invocation
