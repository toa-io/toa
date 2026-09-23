/** What `toa map` writes, and what a process is given by anything but a deployment. */
export const MAP_LOCAL_FILE = '.map.json'

/**
 * Where a deployed process reads the component map from: the directory a chart mounts it in, and
 * the file a command is given. The image names the file, because a mounted ConfigMap is a
 * directory and a file placed into an existing one with `subPath` is the one kind of mount
 * Kubernetes does not update.
 *
 * Gzipped, because a ConfigMap is capped at a megabyte and nothing reads this copy by eye. Named
 * for what it is: a gzip stream called `.json` is something someone opens once and reports as
 * broken, and so is a plain one called `.gz`, which is why a map mounted from a checkout is
 * mounted under its own name.
 */
export const MAP_DIRECTORY = '/etc/toa'

export const MAP_FILE = MAP_LOCAL_FILE + '.gz'

export const MAP = MAP_DIRECTORY + '/' + MAP_FILE

/** Where a container run from a checkout is given the map that checkout wrote. */
export const MAP_LOCAL = MAP_DIRECTORY + '/' + MAP_LOCAL_FILE
