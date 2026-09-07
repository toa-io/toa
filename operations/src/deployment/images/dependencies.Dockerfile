FROM {{build.image}}

{{build.arguments}}

ENV NODE_ENV=production
RUN if [ "{{runtime.registry}}" != "" ]; then npm set registry {{runtime.registry}}; fi
RUN if [ "{{runtime.proxy}}" != "" ]; then npm set proxy {{runtime.proxy}}; fi

WORKDIR /composition
COPY --chown=node:node . /composition

{{build.run}}

# the context holds the manifests alone, so this is every dependency and none of the sources
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
  for entry in *; do if grep -qs '"dependencies"' "$entry/package.json"; then (cd $entry && npm i --omit=dev); fi; done
