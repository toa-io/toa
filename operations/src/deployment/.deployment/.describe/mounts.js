'use strict'

function addMounts (composition, mounts) {
  if (mounts === undefined)
    return

  const used = new Set()

  for (const [key, mount] of Object.entries(mounts)) {
    if (key !== 'global' && !composition.components?.includes(key))
      continue

    for (const { name, path, claim } of mount) {
      if (used.has(name))
        continue

      composition.mounts ??= []
      composition.mounts.push({ name, path, claim })
      used.add(name)
    }
  }
}

exports.addMounts = addMounts
