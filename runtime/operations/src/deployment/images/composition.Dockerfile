FROM node:18-alpine

ENV NODE_ENV=production
RUN npm set registry {{registry}}
RUN npm set proxy {{proxy}}
RUN npm i -g @toa.io/runtime@{{version}} --ignore-scripts

WORKDIR /composition
ADD . .

CMD toa compose *
