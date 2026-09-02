let instances = {}

// the promise is what is remembered, so two components cannot each make a factory
const factory = async (binding) => {
  instances[binding] ??= import(binding).then(({ Factory }) => new Factory())

  return await instances[binding]
}

// for testing purposes
const reset = () => (instances = {})

export { factory, reset }
