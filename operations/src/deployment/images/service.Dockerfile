FROM {{build.image}}

ENV NODE_ENV=production
RUN if [ "{{runtime.registry}}" != "" ]; then npm set registry {{runtime.registry}}; fi
RUN if [ "{{runtime.proxy}}" != "" ]; then npm set proxy {{runtime.proxy}}; fi

WORKDIR /service
COPY --chown=node:node . /service

RUN --mount=type=cache,target=/root/.npm,sharing=locked \
  npm i --omit=dev

# no USER: the runtime drops to `node` itself, and only a process that started as root can
# close its environment under /proc — see runtime/runtime/bin/toa
CMD toa serve .
