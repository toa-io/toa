async function algorithm (bridge, path, endpoint, context) {
  const factory = await resolve(bridge)
  const algorithm = await factory.algorithm(path, endpoint, context)

  algorithm.depends(context)

  return algorithm
}

const event = async (bridge, path, label, context) =>
  (await resolve(bridge)).event(path, label, context)

const receiver = async (bridge, path, label) =>
  (await resolve(bridge)).receiver(path, label)

const guard = async (bridge, path, label, context) =>
  (await resolve(bridge)).guard(path, label, context)

async function rc (bridge, path, context) {
  const factory = await resolve(bridge)

  if (factory.rc === undefined)
    return

  return factory.rc(path, context)
}

const factories = {}

// the promise is what is remembered, so two boots cannot each make a factory
const resolve = async (bridge) => {
  factories[bridge] ??= import(bridge).then(({ Factory }) => new Factory())

  return await factories[bridge]
}

export { algorithm, event, receiver, guard, rc }
