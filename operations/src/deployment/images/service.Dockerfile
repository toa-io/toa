FROM node:18.16.0-alpine3.17

ENV NODE_ENV=production
RUN if [ {{runtime.registry}} != undefined ]; then npm set registry {{runtime.registry}}; fi
RUN if [ {{runtime.proxy}} != undefined ]; then npm set proxy {{runtime.proxy}}; fi
RUN npm i -g @toa.io/runtime@{{runtime.version}} --only=production

WORKDIR /service
COPY --chown=node:node . /service

USER node

RUN npm ci --only=production

CMD toa serve .
