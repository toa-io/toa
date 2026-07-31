FROM node:24.14.0-alpine3.22

ARG VERSION
RUN npm i -g @toa.io/runtime@${VERSION} --omit=dev
