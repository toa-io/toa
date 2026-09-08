FROM {{build.image}}

{{build.arguments}}

ENV NODE_ENV=production
RUN if [ "{{runtime.registry}}" != "" ]; then npm set registry {{runtime.registry}}; fi
RUN if [ "{{runtime.proxy}}" != "" ]; then npm set proxy {{runtime.proxy}}; fi

WORKDIR /composition
COPY --chown=node:node . /composition

{{build.run}}

# the context holds the manifests alone, so this is every dependency and none of the sources.
# `.packages` is a dotfile, so the glob does not reach it
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
  for entry in *; do if grep -qs '"dependencies"' "$entry/package.json"; then (cd $entry && npm i --omit=dev); fi; done

# what the extensions need for what these components declare: installed beside the extension
# that reads the declaration, in Toa's own install, because that is where Node resolves an
# extension's imports from — and one copy for the composition rather than one per component
# `--legacy-peer-deps` for the reason the base image installs with it: what is added here
# re-resolves the tree, and a peer nothing imports comes back with it — 23 MB of `typescript`
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
  if [ -s .packages ]; then npm i --prefix /toa --omit=dev --legacy-peer-deps $(cat .packages); fi
