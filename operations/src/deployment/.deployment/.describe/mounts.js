'use strict'

function addMounts (composition, mounts, keys = composition.components) {
  if (mounts === undefined)
    return

  const used = new Set()

  for (const [key, mount] of Object.entries(mounts)) {
    if (key !== 'global' && !keys?.includes(key))
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
