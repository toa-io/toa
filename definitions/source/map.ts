/**
 * Where a deployed process reads the component map from: the directory a chart mounts it in, and
 * the file a command is given. The image names the file, because a mounted ConfigMap is a
 * directory and a file placed into an existing one with `subPath` is the one kind of mount
 * Kubernetes does not update.
 *
 * Gzipped, because a ConfigMap is capped at a megabyte and nothing reads this copy by eye. Named
 * for what it is: a gzip stream called `.json` is something someone opens once and reports as
 * broken.
 */
export const MAP_DIRECTORY = '/etc/toa'

export const MAP_FILE = '.map.json.gz'

export const MAP = MAP_DIRECTORY + '/' + MAP_FILE
