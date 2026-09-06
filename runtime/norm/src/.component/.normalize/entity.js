export function entity (component) {
  if (component.entity === undefined) return

  component.entity.storage ??= '@toa.io/storages.mongodb'
  component.entity.associated ??= false
  component.entity.custom ??= false
}
