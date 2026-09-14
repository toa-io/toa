/**
 * Where a deployed process reads the component map from: the directory a chart mounts it in, and
 * the file a command is given. The image names the file, because a mounted ConfigMap is a
 * directory and a file placed into an existing one with `subPath` is the one kind of mount
 * Kubernetes does not update.
 */
export const MAP_DIRECTORY = '/etc/toa'

export const MAP_FILE = 'components.json'

export const MAP = MAP_DIRECTORY + '/' + MAP_FILE
