FROM {{build.image}}

{{build.arguments}}

ENV NODE_ENV=production
RUN if [ "{{runtime.registry}}" != "" ]; then npm set registry {{runtime.registry}}; fi
RUN if [ "{{runtime.proxy}}" != "" ]; then npm set proxy {{runtime.proxy}}; fi
RUN npm i -g @toa.io/runtime@{{runtime.version}} --omit=dev

WORKDIR /composition
COPY --chown=node:node . /composition

{{build.run}}

# run 'npm i' in each component
RUN for entry in *; do if [ -f "$entry/package.json" ]; then (cd $entry && npm i --omit=dev); fi; done

USER node
CMD toa compose *
