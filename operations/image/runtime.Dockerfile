FROM node:24.14.0-alpine3.22

ARG VERSION

# installed locally rather than globally: the binary is @toa.io/cli's, which the runtime depends
# on, and npm links a dependency's binaries only into a local `node_modules/.bin`
WORKDIR /toa

# mounted rather than written: npm's cache is a hundred megabytes, and a layer keeps whatever
# the command left behind
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
  npm i @toa.io/runtime@${VERSION} --omit=dev

ENV PATH=/toa/node_modules/.bin:$PATH
