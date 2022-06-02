FROM node:18-alpine

ENV NODE_ENV=production
RUN npm set registry {{registry}}
RUN npm set proxy {{proxy}}
RUN npm i -g @toa.io/runtime@{{version}}

WORKDIR /service
ADD . .
RUN npm i

CMD toa serve {{.service}}
