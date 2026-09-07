FROM {{build.image}}

ENV NODE_ENV=production
RUN if [ "{{runtime.registry}}" != "" ]; then npm set registry {{runtime.registry}}; fi
RUN if [ "{{runtime.proxy}}" != "" ]; then npm set proxy {{runtime.proxy}}; fi

WORKDIR /service
COPY --chown=node:node . /service

RUN --mount=type=cache,target=/root/.npm,sharing=locked \
  npm i --omit=dev

# a component of the extension's own declares what it imports, and it is installed beside the
# component rather than beside the extension: an application that runs none of them, and the
# runtime image every application is built on, carry nothing for them
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
  for entry in components/*; do if grep -qs '"dependencies"' "$entry/package.json"; then (cd $entry && npm i --omit=dev); fi; done

# no USER: the runtime drops to `node` itself, and only a process that started as root can
# close its environment under /proc — see runtime/runtime/bin/toa
CMD toa serve .
