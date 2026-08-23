FROM {{build.image}}

{{build.arguments}}

ENV NODE_ENV=production
RUN if [ "{{runtime.registry}}" != "" ]; then npm set registry {{runtime.registry}}; fi
RUN if [ "{{runtime.proxy}}" != "" ]; then npm set proxy {{runtime.proxy}}; fi

WORKDIR /composition
COPY --chown=node:node . /composition

{{build.run}}

RUN --mount=type=cache,target=/root/.npm \
  for entry in components/*; do if [ -f "$entry/package.json" ]; then (cd $entry && npm i --omit=dev); fi; done

USER node
CMD toa mono .
