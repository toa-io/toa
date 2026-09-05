function terminate (_, changeset) {
  changeset.DELETED = Date.now()
}

export { terminate as assignment }
