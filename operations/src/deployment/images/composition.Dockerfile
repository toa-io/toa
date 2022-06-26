FROM node:18.2.0-alpine3.15

ENV NODE_ENV=production
RUN npm set registry {{registry}}
RUN npm set proxy {{proxy}}
RUN npm i -g @toa.io/runtime@{{version}}

WORKDIR /composition
ADD . .

# run 'npm i' in each component
# TODO: add check if package.json exists
RUN find . -maxdepth 1 -type d \( ! -name . \) -exec /bin/sh -c "cd '{}' && npm i" \;

CMD toa compose *
