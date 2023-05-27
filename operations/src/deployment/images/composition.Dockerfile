FROM node:18.16.0-alpine3.17

ENV NODE_ENV=production
RUN if [ {{registry}} != undefined ]; then npm set registry {{registry}}; fi
RUN if [ {{proxy}} != undefined ]; then npm set proxy {{proxy}}; fi
RUN npm i -g @toa.io/runtime@{{version}}

WORKDIR /composition
ADD . .

# run 'npm i' in each component
RUN find . -maxdepth 1 -type d \( ! -name . \) -exec /bin/sh -c "cd '{}' && if [ -f package.json ]; then npm i; fi" \;

CMD toa compose *
