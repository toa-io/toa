FROM node:24.14.0-alpine3.22

ARG VERSION

# installed locally rather than globally: the binary is @toa.io/cli's, which the runtime depends
# on, and npm links a dependency's binaries only into a local `node_modules/.bin`
WORKDIR /toa

# what the install scripts of Toa's own dependencies may do, stated where npm reads it — the
# project Toa is installed into, which every later `npm i --prefix /toa` of an image built on
# this one installs into too. npm runs no script nobody allowed and warns about each, and the
# one there is, msgpackr-extract's, only looks for the binary its optional dependency provides
RUN echo '{ "private": true, "allowScripts": { "msgpackr-extract": false } }' > package.json

# mounted rather than written: npm's cache is a hundred megabytes, and a layer keeps whatever
# the command left behind
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
  npm i @toa.io/runtime@${VERSION} --omit=dev

ENV PATH=/toa/node_modules/.bin:$PATH
