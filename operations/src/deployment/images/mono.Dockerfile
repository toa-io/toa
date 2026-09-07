FROM {{build.image}}

{{build.arguments}}

ENV NODE_ENV=production
RUN if [ "{{runtime.registry}}" != "" ]; then npm set registry {{runtime.registry}}; fi
RUN if [ "{{runtime.proxy}}" != "" ]; then npm set proxy {{runtime.proxy}}; fi

WORKDIR /composition
COPY --chown=node:node . /composition

{{build.run}}

RUN --mount=type=cache,target=/root/.npm,sharing=locked \
  for entry in *; do if grep -qs '"dependencies"' "$entry/package.json"; then (cd $entry && npm i --omit=dev); fi; done

# no USER: the runtime drops to `node` itself, and only a process that started as root can
# close its environment under /proc — see runtime/runtime/bin/toa
CMD toa mono *
