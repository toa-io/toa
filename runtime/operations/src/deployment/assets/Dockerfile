# TODO: bridge specifics

FROM node:alpine

RUN NPM_CONFIG_REGISTRY={{registry}} npm i -g @toa.io/runtime@{{version}}

WORKDIR /composition
ADD . .

CMD toa compose *
