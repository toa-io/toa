export function assignment(_, changeset) {
  changeset.DELETED = Date.now()
}
