FROM node:24.14.0-alpine3.22

ARG VERSION

# installed locally rather than globally: the binary is @toa.io/cli's, which the runtime depends
# on, and npm links a dependency's binaries only into a local `node_modules/.bin`
WORKDIR /toa

# mounted rather than written: npm's cache is a hundred megabytes, and a layer keeps whatever
# the command left behind.
# `--legacy-peer-deps` installs no peer this does not ask for: `promex`, `reretry` and
# `matchacho` declare `typescript` a peer without marking it optional, and nothing here imports
# it. Every other peer in the closure is a dependency of the runtime's already. Drop the flag
# once those three are published with `peerDependenciesMeta`.
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
  npm i @toa.io/runtime@${VERSION} --omit=dev --legacy-peer-deps

ENV PATH=/toa/node_modules/.bin:$PATH
