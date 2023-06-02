FROM node:18.16.0-alpine3.17

{{build.arguments}}

ENV NODE_ENV=production
RUN if [ {{runtime.registry}} != undefined ]; then npm set registry {{runtime.registry}}; fi
RUN if [ {{runtime.proxy}} != undefined ]; then npm set proxy {{runtime.proxy}}; fi
RUN npm i -g @toa.io/runtime@{{runtime.version}} --omit=dev

WORKDIR /composition
COPY --chown=node:node . /composition

{{build.run}}

# run 'npm i' in each component
RUN find . -maxdepth 1 -type d \( ! -name . \) -exec /bin/sh -c "cd '{}' && if [ -f package.json ]; then npm i --omit=dev; fi" \;

USER node
CMD toa compose *
