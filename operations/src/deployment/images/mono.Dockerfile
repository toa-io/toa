FROM {{build.image}}

# the one instruction that touches the filesystem, and linked: the base is not pulled to lay
# the sources over it, and a push carries this layer and a manifest, not the base's layers.
# Owned by root like the dependencies beside them: a linked layer knows no user by name,
# and the runtime reads its sources, it does not write them
COPY --link . /composition

# no USER: the runtime drops to `node` itself, and only a process that started as root can
# close its environment under /proc — see runtime/runtime/bin/toa
CMD toa mono *
